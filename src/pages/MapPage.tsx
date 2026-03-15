import 'mapbox-gl/dist/mapbox-gl.css';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  X,
  MapPin,
  ThumbsUp,
  Loader2,
  Navigation,
  Users,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

const categoryColors: Record<string, string> = {
  food: '#E8593C',
  community: '#2D5A3D',
  health: '#185FA5',
  banking: '#854F0B',
  education: '#534AB7',
  housing: '#993556',
  worship: '#639922',
  transport: '#5F5E5A',
  recreation: '#D4A017',
  other: '#6B7280',
};

const categories = Object.keys(categoryColors);

interface MapPinData {
  id: string;
  title: string;
  category: string;
  description: string | null;
  address: string | null;
  hours: string | null;
  latitude: number;
  longitude: number;
  upvotes: number;
  user_id: string | null;
  created_at: string;
}

interface NearbyUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  country_of_origin: string | null;
  university: string | null;
}

interface AddPinForm {
  title: string;
  category: string;
  description: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;
const OTTAWA_CENTER: [number, number] = [-75.6972, 45.4215];
const DEFAULT_ZOOM = 13;

export default function MapPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const [pins, setPins] = useState<MapPinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [addForm, setAddForm] = useState<AddPinForm>({
    title: '',
    category: 'food',
    description: '',
    address: '',
    latitude: null,
    longitude: null,
  });

  const fetchPins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('map_pins')
        .select('*');
      if (fetchError) throw fetchError;
      setPins(data ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load pins';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPins();
  }, [fetchPins]);

  const buildGeoJSON = useCallback(
    (
      pinData: MapPinData[],
      filter: string,
      query: string,
    ): GeoJSON.FeatureCollection<GeoJSON.Point> => {
      const lower = query.toLowerCase();
      const filtered = pinData.filter((pin) => {
        const matchesCategory = filter === 'all' || pin.category === filter;
        const matchesSearch =
          !lower ||
          pin.title.toLowerCase().includes(lower) ||
          (pin.description ?? '').toLowerCase().includes(lower);
        return matchesCategory && matchesSearch;
      });

      return {
        type: 'FeatureCollection',
        features: filtered.map((pin) => ({
          type: 'Feature',
          id: pin.id,
          geometry: {
            type: 'Point',
            coordinates: [pin.longitude, pin.latitude],
          },
          properties: {
            id: pin.id,
            title: pin.title,
            category: pin.category,
            description: pin.description ?? '',
            address: pin.address ?? '',
            hours: pin.hours ?? '',
            upvotes: pin.upvotes,
            color: categoryColors[pin.category] ?? categoryColors.other,
          },
        })),
      };
    },
    [],
  );

  const fetchNearbyUsers = useCallback(async (bounds: mapboxgl.LngLatBounds) => {
    try {
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const { data, error: fetchErr } = await supabase
        .from('map_pins')
        .select('user_id')
        .gte('latitude', sw.lat)
        .lte('latitude', ne.lat)
        .gte('longitude', sw.lng)
        .lte('longitude', ne.lng);

      if (fetchErr) throw fetchErr;

      const uniqueIds = [...new Set((data ?? []).filter((d: { user_id: string | null }) => d.user_id).map((d: { user_id: string | null }) => d.user_id as string))];
      if (uniqueIds.length === 0) {
        setNearbyUsers([]);
        return;
      }

      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, country_of_origin, university')
        .in('id', uniqueIds);

      if (profileErr) throw profileErr;
      setNearbyUsers(profiles ?? []);
    } catch {
      setNearbyUsers([]);
    }
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: OTTAWA_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right',
    );

    map.on('load', () => {
      const geojson = buildGeoJSON(pins, activeFilter, searchQuery);

      map.addSource('pins', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'pins',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            10,
            '#f1f075',
            30,
            '#f28cb1',
          ],
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 30, 40],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'pins',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 14,
        },
        paint: {
          'text-color': '#1a1a1a',
        },
      });

      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'pins',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id;
        const source = map.getSource('pins') as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          const geometry = features[0].geometry as GeoJSON.Point;
          map.easeTo({
            center: geometry.coordinates as [number, number],
            zoom: zoom ?? DEFAULT_ZOOM,
          });
        });
      });

      map.on('click', 'unclustered-point', (e) => {
        if (!e.features || !e.features.length) return;
        const feature = e.features[0];
        const geometry = feature.geometry as GeoJSON.Point;
        const coords = geometry.coordinates.slice() as [number, number];
        const props = feature.properties!;

        while (Math.abs(e.lngLat.lng - coords[0]) > 180) {
          coords[0] += e.lngLat.lng > coords[0] ? 360 : -360;
        }

        if (popupRef.current) popupRef.current.remove();

        const categoryColor = categoryColors[props.category] ?? categoryColors.other;

        const popupHTML = `
          <div style="max-width:260px;font-family:system-ui,sans-serif;">
            <h3 style="margin:0 0 6px;font-size:16px;font-weight:600;">${escapeHtml(props.title)}</h3>
            <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;color:#fff;background:${categoryColor};margin-bottom:6px;">
              ${escapeHtml(props.category)}
            </span>
            ${props.description ? `<p style="margin:6px 0;font-size:13px;color:#4b5563;">${escapeHtml(props.description)}</p>` : ''}
            ${props.address ? `<p style="margin:4px 0;font-size:12px;color:#6b7280;"><strong>Address:</strong> ${escapeHtml(props.address)}</p>` : ''}
            ${props.hours ? `<p style="margin:4px 0;font-size:12px;color:#6b7280;"><strong>Hours:</strong> ${escapeHtml(props.hours)}</p>` : ''}
            <div style="margin-top:8px;display:flex;align-items:center;gap:6px;">
              <button id="upvote-btn-${props.id}" style="display:flex;align-items:center;gap:4px;padding:4px 10px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;font-size:12px;">
                &#128077; <span id="upvote-count-${props.id}">${props.upvotes ?? 0}</span>
              </button>
            </div>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 15, closeButton: true })
          .setLngLat(coords)
          .setHTML(popupHTML)
          .addTo(map);

        popupRef.current = popup;

        setTimeout(() => {
          const btn = document.getElementById(`upvote-btn-${props.id}`);
          if (btn) {
            btn.addEventListener('click', () => handleUpvote(props.id));
          }
        }, 0);
      });

      map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('mouseenter', 'unclustered-point', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('moveend', () => {
        const bounds = map.getBounds();
        if (bounds) fetchNearbyUsers(bounds);
      });

      const initialBounds = map.getBounds();
      if (initialBounds) fetchNearbyUsers(initialBounds);
    });

    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('pins') as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    const geojson = buildGeoJSON(pins, activeFilter, searchQuery);
    source.setData(geojson);
  }, [pins, activeFilter, searchQuery, buildGeoJSON]);

  const handleUpvote = async (pinId: string) => {
    const pin = pins.find((p) => p.id === pinId);
    if (!pin) return;

    const newUpvotes = pin.upvotes + 1;

    setPins((prev) =>
      prev.map((p) => (p.id === pinId ? { ...p, upvotes: newUpvotes } : p)),
    );

    const countEl = document.getElementById(`upvote-count-${pinId}`);
    if (countEl) countEl.textContent = String(newUpvotes);

    try {
      const { error: updateErr } = await supabase
        .from('map_pins')
        .update({ upvotes: newUpvotes })
        .eq('id', pinId);
      if (updateErr) throw updateErr;
    } catch {
      setPins((prev) =>
        prev.map((p) => (p.id === pinId ? { ...p, upvotes: pin.upvotes } : p)),
      );
      if (countEl) countEl.textContent = String(pin.upvotes);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAddForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setLocatingUser(false);
      },
      () => {
        setLocatingUser(false);
      },
      { enableHighAccuracy: true },
    );
  };

  const handleAddPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !addForm.title.trim()) return;

    const latitude = addForm.latitude ?? OTTAWA_CENTER[1];
    const longitude = addForm.longitude ?? OTTAWA_CENTER[0];

    setSubmitting(true);
    try {
      const { data, error: insertErr } = await supabase
        .from('map_pins')
        .insert({
          title: addForm.title.trim(),
          category: addForm.category,
          description: addForm.description.trim() || null,
          address: addForm.address.trim() || null,
          latitude,
          longitude,
          upvotes: 0,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      if (data) {
        setPins((prev) => [...prev, data as MapPinData]);
      }

      setAddForm({
        title: '',
        category: 'food',
        description: '',
        address: '',
        latitude: null,
        longitude: null,
      });
      setShowAddModal(false);

      if (mapRef.current) {
        mapRef.current.flyTo({ center: [longitude, latitude], zoom: 15 });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add pin';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterClick = (cat: string) => {
    setActiveFilter(cat);
  };

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70">
          <Loader2 className="h-8 w-8 animate-spin text-green-700" />
          <span className="ml-2 text-sm text-gray-600">{t('map.loading', 'Loading map...')}</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="absolute top-16 left-1/2 z-50 -translate-x-1/2 transform">
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 shadow-md">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
            <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="absolute top-3 left-3 z-10 w-72">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('map.searchPlaceholder', 'Search pins...')}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm shadow-md focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="absolute top-14 left-3 right-3 z-10 md:right-auto">
        <div className="flex gap-2 overflow-x-auto rounded-lg bg-white/90 px-3 py-2 shadow-md backdrop-blur-sm scrollbar-hide">
          <button
            onClick={() => handleFilterClick('all')}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-green-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('map.filterAll', 'All')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleFilterClick(cat)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                activeFilter === cat
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={
                activeFilter === cat
                  ? { backgroundColor: categoryColors[cat] }
                  : undefined
              }
            >
              {t(`map.category.${cat}`, cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-white/90 p-3 shadow-md backdrop-blur-sm">
        <p className="mb-2 text-xs font-semibold text-gray-700">{t('map.legend', 'Legend')}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {categories.map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: categoryColors[cat] }}
              />
              <span className="text-xs capitalize text-gray-600">
                {t(`map.category.${cat}`, cat)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Pin FAB */}
      {user && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="absolute bottom-6 right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-green-700 text-white shadow-lg hover:bg-green-800 md:bottom-6 md:right-80"
          aria-label={t('map.addPin', 'Add Pin')}
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      )}

      {/* People Nearby Sidebar */}
      <div
        className={`absolute top-0 right-0 z-10 hidden h-full w-72 transform bg-white shadow-lg transition-transform duration-300 md:block ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-700" />
            <h2 className="text-sm font-semibold text-gray-800">
              {t('map.peopleNearby', 'People Nearby')}
            </h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-[calc(100%-49px)] overflow-y-auto p-3">
          {nearbyUsers.length === 0 ? (
            <p className="py-8 text-center text-xs text-gray-400">
              {t('map.noNearbyUsers', 'No people found in this area')}
            </p>
          ) : (
            <div className="space-y-2">
              {nearbyUsers.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-2 transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-100">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name ?? ''}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-green-700">
                        {(profile.full_name ?? '?')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {profile.full_name ?? t('map.anonymous', 'Anonymous')}
                    </p>
                    {profile.country_of_origin && (
                      <p className="truncate text-xs text-gray-500">{profile.country_of_origin}</p>
                    )}
                    {profile.university && (
                      <p className="truncate text-xs text-gray-400">{profile.university}</p>
                    )}
                  </div>
                  <a
                    href="/forum"
                    className="shrink-0 rounded-md bg-green-50 p-1.5 text-green-700 transition-colors hover:bg-green-100"
                    title={t('map.connect', 'Connect')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar toggle (when collapsed) */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute top-3 right-3 z-10 hidden rounded-lg bg-white p-2 shadow-md hover:bg-gray-50 md:block"
        >
          <Users className="h-5 w-5 text-green-700" />
        </button>
      )}

      {/* Add Pin Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAddModal(false);
            }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl md:rounded-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  <MapPin className="mr-1.5 inline-block h-5 w-5 text-green-700" />
                  {t('map.addNewPin', 'Add New Pin')}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddPin} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    {t('map.pinTitle', 'Title')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.title}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                    placeholder={t('map.pinTitlePlaceholder', 'e.g. Halal Grocery Store')}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    {t('map.pinCategory', 'Category')}
                  </label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm capitalize focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="capitalize">
                        {t(`map.category.${cat}`, cat)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    {t('map.pinDescription', 'Description')}
                  </label>
                  <textarea
                    value={addForm.description}
                    onChange={(e) =>
                      setAddForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                    placeholder={t('map.pinDescriptionPlaceholder', 'Tell others about this place...')}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    {t('map.pinAddress', 'Address')}
                  </label>
                  <input
                    type="text"
                    value={addForm.address}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                    placeholder={t('map.pinAddressPlaceholder', '123 Main St, Ottawa, ON')}
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locatingUser}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-60"
                  >
                    {locatingUser ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                    {addForm.latitude !== null
                      ? t('map.locationSet', 'Location set!')
                      : t('map.useMyLocation', 'Use my current location')}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !addForm.title.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-800 disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  {t('map.submitPin', 'Add Pin')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
