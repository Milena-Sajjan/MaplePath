import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Home, DollarSign, BedDouble, Bath, MapPin, Plus, X,
  Filter, Calendar, Wifi, Car, Dog, Users, Eye, MessageSquare
} from 'lucide-react';
import { supabase, isDemoMode } from '../lib/supabase';
import { demoHousing } from '../lib/demoData';
import { useAuthStore } from '../store/authStore';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { formatTimeAgo } from '../lib/utils';

interface Listing {
  id: string;
  user_id: string | null;
  title: string;
  listing_type: string;
  price_monthly: number;
  bedrooms: number;
  bathrooms: number;
  description: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  available_from: string;
  amenities: string[];
  furnished: boolean;
  utilities: boolean;
  pets_allowed: boolean;
  student_only: boolean;
  gender_pref: string;
  images: string[];
  created_at: string;
  profiles?: { full_name: string; country: string; university: string; languages: string[] };
}

interface Filters {
  type: string;
  minPrice: string;
  maxPrice: string;
  furnished: boolean;
  utilities: boolean;
  pets: boolean;
  studentOnly: boolean;
  search: string;
}

const LISTING_TYPES = ['All', 'Room', 'Apartment', 'House', 'Basement', 'Homestay', 'Roommate Wanted'];
const AMENITIES = ['WiFi', 'Parking', 'Laundry', 'AC', 'Dishwasher', 'Gym', 'Storage', 'Balcony'];
const TYPE_COLORS: Record<string, string> = {
  Room: 'bg-blue-100 text-blue-700',
  Apartment: 'bg-purple-100 text-purple-700',
  House: 'bg-green-100 text-green-700',
  Basement: 'bg-yellow-100 text-yellow-700',
  Homestay: 'bg-pink-100 text-pink-700',
  'Roommate Wanted': 'bg-orange-100 text-orange-700',
};

export default function HousingPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    type: 'All', minPrice: '', maxPrice: '',
    furnished: false, utilities: false, pets: false, studentOnly: false, search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [roommateMode, setRoommateMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contactSending, setContactSending] = useState(false);

  const [form, setForm] = useState({
    title: '', type: 'Room', price: '', bedrooms: '1', bathrooms: '1',
    description: '', address: '', available_from: '',
    amenities: [] as string[], furnished: false, utilities_included: false,
    pets_allowed: false, student_only: false, gender_preference: 'No preference',
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      if (isDemoMode) {
        let filtered = demoHousing as unknown as Listing[];
        if (filters.type !== 'All') filtered = filtered.filter(l => l.listing_type.toLowerCase() === filters.type.toLowerCase());
        if (filters.minPrice) filtered = filtered.filter(l => l.price_monthly >= Number(filters.minPrice));
        if (filters.maxPrice) filtered = filtered.filter(l => l.price_monthly <= Number(filters.maxPrice));
        if (filters.furnished) filtered = filtered.filter(l => l.furnished);
        if (filters.utilities) filtered = filtered.filter(l => l.utilities);
        if (filters.pets) filtered = filtered.filter(l => l.pets_allowed);
        if (filters.studentOnly) filtered = filtered.filter(l => l.student_only);
        if (filters.search) filtered = filtered.filter(l => l.title.toLowerCase().includes(filters.search.toLowerCase()));
        setListings(filtered);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('housing_listings')
        .select('*, profiles(full_name, country, university, languages)')
        .order('created_at', { ascending: false });

      if (filters.type !== 'All') query = query.eq('listing_type', filters.type as any);
      if (filters.minPrice) query = query.gte('price_monthly', Number(filters.minPrice));
      if (filters.maxPrice) query = query.lte('price_monthly', Number(filters.maxPrice));
      if (filters.furnished) query = query.eq('furnished', true);
      if (filters.utilities) query = query.eq('utilities', true);
      if (filters.pets) query = query.eq('pets_allowed', true);
      if (filters.studentOnly) query = query.eq('student_only', true);
      if (filters.search) query = query.ilike('title', `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      setListings((data as unknown as Listing[]) || []);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-75.6972, 45.4215],
      zoom: 11,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    listings.forEach(listing => {
      if (!listing.latitude || !listing.longitude || !mapRef.current) return;
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div class="p-2"><strong>${listing.title}</strong><br/>$${listing.price_monthly}/mo</div>`
      );
      const marker = new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([listing.longitude, listing.latitude])
        .setPopup(popup)
        .addTo(mapRef.current);
      markersRef.current.push(marker);
    });
  }, [listings]);

  const handlePost = async () => {
    if (!user || submitting) return;
    setSubmitting(true);
    try {
      if (isDemoMode) {
        const newListing: Listing = {
          id: `h-${Date.now()}`,
          user_id: user.id,
          title: form.title,
          listing_type: form.type,
          price_monthly: Number(form.price),
          bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
          description: form.description,
          address: form.address,
          city: '',
          latitude: null,
          longitude: null,
          available_from: form.available_from || '',
          amenities: form.amenities,
          furnished: form.furnished,
          utilities: form.utilities_included,
          pets_allowed: form.pets_allowed,
          student_only: form.student_only,
          gender_pref: form.gender_preference,
          images: [],
          created_at: new Date().toISOString(),
        };
        setListings(prev => [newListing, ...prev]);
        setShowPostModal(false);
        setForm({
          title: '', type: 'Room', price: '', bedrooms: '1', bathrooms: '1',
          description: '', address: '', available_from: '',
          amenities: [], furnished: false, utilities_included: false,
          pets_allowed: false, student_only: false, gender_preference: 'No preference',
        });
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from('housing_listings').insert({
        user_id: user.id,
        title: form.title,
        listing_type: form.type,
        price_monthly: Number(form.price),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        description: form.description,
        address: form.address,
        city: '',
        available_from: form.available_from || null,
        amenities: form.amenities,
        furnished: form.furnished,
        utilities: form.utilities_included,
        pets_allowed: form.pets_allowed,
        student_only: form.student_only,
        gender_pref: form.gender_preference,
        images: [],
      });
      if (error) throw error;
      setShowPostModal(false);
      setForm({
        title: '', type: 'Room', price: '', bedrooms: '1', bathrooms: '1',
        description: '', address: '', available_from: '',
        amenities: [], furnished: false, utilities_included: false,
        pets_allowed: false, student_only: false, gender_preference: 'No preference',
      });
      fetchListings();
    } catch (err) {
      console.error('Failed to post listing:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContact = async (listing: Listing) => {
    if (!user || contactSending) return;
    setContactSending(true);
    try {
      if (isDemoMode) {
        // In demo mode, just simulate a successful inquiry
        await new Promise(resolve => setTimeout(resolve, 500));
        setContactSending(false);
        return;
      }

      const { error: inquiryError } = await supabase.from('housing_inquiries').insert({
        listing_id: listing.id,
        user_id: user.id,
        message: `Interested in your listing "${listing.title}"`,
      });
      if (inquiryError) throw inquiryError;
      await supabase.from('notifications').insert({
        user_id: listing.user_id,
        type: 'housing_inquiry',
        title: 'New Housing Inquiry',
        message: `Someone is interested in your listing "${listing.title}"`,
        link: `/housing?listing=${listing.id}`,
      });
    } catch (err) {
      console.error('Failed to send inquiry:', err);
    } finally {
      setContactSending(false);
    }
  };

  const handleShare = (listing: Listing) => {
    const url = `${window.location.origin}/housing?listing=${listing.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
  };

  const toggleAmenity = (amenity: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const filtered = roommateMode
    ? listings.filter(l => l.listing_type === 'Roommate Wanted')
    : listings;

  const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900">{t('housing.title', 'Housing')}</h1>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">{t('housing.roommateMode', 'Looking for a roommate')}</span>
                <button
                  onClick={() => setRoommateMode(!roommateMode)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${roommateMode ? 'bg-red-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${roommateMode ? 'translate-x-5' : ''}`} />
                </button>
              </label>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                {t('housing.filters', 'Filters')}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              placeholder={t('housing.searchPlaceholder', 'Search listings...')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Filter bar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-3 pb-3">
                  <select
                    value={filters.type}
                    onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                  >
                    {LISTING_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                      placeholder="Min"
                      className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                      placeholder="Max"
                      className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-sm text-gray-600">
                    <input type="checkbox" checked={filters.furnished} onChange={e => setFilters(f => ({ ...f, furnished: e.target.checked }))} className="rounded text-red-500" />
                    {t('housing.furnished', 'Furnished')}
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-gray-600">
                    <input type="checkbox" checked={filters.utilities} onChange={e => setFilters(f => ({ ...f, utilities: e.target.checked }))} className="rounded text-red-500" />
                    {t('housing.utilities', 'Utilities included')}
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-gray-600">
                    <input type="checkbox" checked={filters.pets} onChange={e => setFilters(f => ({ ...f, pets: e.target.checked }))} className="rounded text-red-500" />
                    <Dog className="w-3.5 h-3.5" />
                    {t('housing.pets', 'Pets allowed')}
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-gray-600">
                    <input type="checkbox" checked={filters.studentOnly} onChange={e => setFilters(f => ({ ...f, studentOnly: e.target.checked }))} className="rounded text-red-500" />
                    <Users className="w-3.5 h-3.5" />
                    {t('housing.studentOnly', 'Student only')}
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1600px] mx-auto flex">
        {/* Listings */}
        <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Home className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">{t('housing.noListings', 'No listings found')}</p>
              <p className="text-sm mt-1">{t('housing.tryAdjusting', 'Try adjusting your filters or post a new listing')}</p>
            </div>
          ) : roommateMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(listing => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{listing.profiles?.full_name || t('housing.anonymous', 'Anonymous')}</h3>
                      <p className="text-sm text-gray-500">{listing.profiles?.country}</p>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                      {t('housing.roommateWanted', 'Roommate Wanted')}
                    </span>
                  </div>
                  {listing.profiles?.university && (
                    <p className="text-sm text-gray-600 mb-1">{listing.profiles.university}</p>
                  )}
                  <p className="text-sm text-gray-700 mb-2">{listing.description}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />${listing.price_monthly}/mo budget</span>
                    {listing.profiles?.languages && (
                      <span>{listing.profiles.languages.join(', ')}</span>
                    )}
                  </div>
                  <a
                    href="/forum"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {t('housing.connect', 'Connect')}
                  </a>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(listing => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedListing(listing)}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                >
                  {listing.images && listing.images.length > 0 ? (
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
                      <Home className="w-10 h-10 text-red-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{listing.title}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ml-2 ${TYPE_COLORS[listing.listing_type] || 'bg-gray-100 text-gray-700'}`}>
                        {listing.listing_type}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-red-600 mb-2">${listing.price_monthly}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                      <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{listing.bedrooms}</span>
                      <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{listing.bathrooms}</span>
                      {listing.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{listing.city}</span>}
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatTimeAgo(listing.created_at)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Map panel */}
        <div className="hidden lg:block w-[400px] border-l border-gray-200 sticky top-[160px]" style={{ height: 'calc(100vh - 160px)' }}>
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>
      </div>

      {/* FAB */}
      {user && (
        <button
          onClick={() => setShowPostModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 transition-colors z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedListing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedListing(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {selectedListing.images && selectedListing.images.length > 0 ? (
                <img src={selectedListing.images[0]} alt={selectedListing.title} className="w-full h-56 object-cover rounded-t-2xl" />
              ) : (
                <div className="w-full h-56 bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center rounded-t-2xl">
                  <Home className="w-16 h-16 text-red-300" />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedListing.title}</h2>
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${TYPE_COLORS[selectedListing.listing_type] || 'bg-gray-100 text-gray-700'}`}>
                      {selectedListing.listing_type}
                    </span>
                  </div>
                  <button onClick={() => setSelectedListing(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <p className="text-2xl font-bold text-red-600 mb-4">${selectedListing.price_monthly}<span className="text-base font-normal text-gray-500">/mo</span></p>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" />{selectedListing.bedrooms} {t('housing.beds', 'Beds')}</span>
                  <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{selectedListing.bathrooms} {t('housing.baths', 'Baths')}</span>
                  {selectedListing.address && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{selectedListing.address}</span>}
                </div>

                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{selectedListing.description}</p>

                {selectedListing.amenities && selectedListing.amenities.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">{t('housing.amenities', 'Amenities')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedListing.amenities.map(a => (
                        <span key={a} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
                  {selectedListing.furnished && <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full">{t('housing.furnished', 'Furnished')}</span>}
                  {selectedListing.utilities && <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full"><Wifi className="w-3.5 h-3.5" />{t('housing.utilities', 'Utilities included')}</span>}
                  {selectedListing.pets_allowed && <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-full"><Dog className="w-3.5 h-3.5" />{t('housing.pets', 'Pets allowed')}</span>}
                  {selectedListing.student_only && <span className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full"><Users className="w-3.5 h-3.5" />{t('housing.studentOnly', 'Student only')}</span>}
                </div>

                {selectedListing.available_from && (
                  <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {t('housing.availableFrom', 'Available from')}: {new Date(selectedListing.available_from).toLocaleDateString()}
                  </p>
                )}

                {selectedListing.latitude && selectedListing.longitude && (
                  <div className="w-full h-40 bg-gray-100 rounded-lg mb-4 overflow-hidden" ref={el => {
                    if (!el || el.dataset.initialized) return;
                    el.dataset.initialized = 'true';
                    const token = import.meta.env.VITE_MAPBOX_TOKEN;
                    if (!token) return;
                    mapboxgl.accessToken = token;
                    const miniMap = new mapboxgl.Map({
                      container: el,
                      style: 'mapbox://styles/mapbox/streets-v12',
                      center: [selectedListing.longitude!, selectedListing.latitude!],
                      zoom: 14,
                      interactive: false,
                    });
                    new mapboxgl.Marker({ color: '#ef4444' })
                      .setLngLat([selectedListing.longitude!, selectedListing.latitude!])
                      .addTo(miniMap);
                  }} />
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleContact(selectedListing)}
                    disabled={contactSending || selectedListing.user_id === user?.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {contactSending ? t('housing.sending', 'Sending...') : t('housing.contactLandlord', 'Contact Landlord')}
                  </button>
                  <button
                    onClick={() => handleShare(selectedListing)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    {t('housing.share', 'Share Listing')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Listing Modal */}
      <AnimatePresence>
        {showPostModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPostModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900">{t('housing.postListing', 'Post a Listing')}</h2>
                <button onClick={() => setShowPostModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('housing.formTitle', 'Title')}</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('housing.formType', 'Type')}</label>
                    <select
                      value={form.type}
                      onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {LISTING_TYPES.filter(t => t !== 'All').map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('housing.formPrice', 'Monthly Price ($)')}</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('housing.formBeds', 'Bedrooms')}</label>
                    <input
                      type="number"
                      value={form.bedrooms}
                      onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('housing.formBaths', 'Bathrooms')}</label>
                    <input
                      type="number"
                      value={form.bathrooms}
                      onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('housing.formDescription', 'Description')}</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('housing.formAddress', 'Address')}</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('housing.formAvailable', 'Available From')}</label>
                  <input
                    type="date"
                    value={form.available_from}
                    onChange={e => setForm(f => ({ ...f, available_from: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('housing.formAmenities', 'Amenities')}</label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map(amenity => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          form.amenities.includes(amenity)
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-red-300'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={form.furnished} onChange={e => setForm(f => ({ ...f, furnished: e.target.checked }))} className="rounded text-red-500" />
                    {t('housing.furnished', 'Furnished')}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={form.utilities_included} onChange={e => setForm(f => ({ ...f, utilities_included: e.target.checked }))} className="rounded text-red-500" />
                    {t('housing.utilities', 'Utilities included')}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={form.pets_allowed} onChange={e => setForm(f => ({ ...f, pets_allowed: e.target.checked }))} className="rounded text-red-500" />
                    {t('housing.pets', 'Pets allowed')}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={form.student_only} onChange={e => setForm(f => ({ ...f, student_only: e.target.checked }))} className="rounded text-red-500" />
                    {t('housing.studentOnly', 'Student only')}
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('housing.formGender', 'Gender Preference')}</label>
                  <select
                    value={form.gender_preference}
                    onChange={e => setForm(f => ({ ...f, gender_preference: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="No preference">No preference</option>
                    <option value="Female only">Female only</option>
                    <option value="Male only">Male only</option>
                  </select>
                </div>

                <button
                  onClick={handlePost}
                  disabled={submitting || !form.title || !form.price}
                  className="w-full py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {submitting ? t('housing.posting', 'Posting...') : t('housing.submitListing', 'Submit Listing')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
