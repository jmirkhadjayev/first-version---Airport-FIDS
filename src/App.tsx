import { useState, useEffect, useMemo, Fragment, useRef } from 'react';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { 
  Search, 
  RefreshCw, 
  Plane,
  Clock,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Filter,
  Info,
  MapPin,
  ArrowRight,
  PlaneTakeoff,
  PlaneLanding,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchFlights, Flight, FlightType } from './services/airportService';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [flights, setFlights] = useState<Flight[]>([]);
  const flightRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Derive activeTab from URL
  const activeTab = location.pathname.includes('/arrivals') ? 'ARRIVAL' : 'DEPARTURE';
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [modalTab, setModalTab] = useState<'INFO' | 'CARGO'>('INFO');

  useEffect(() => {
    if (!selectedFlight) setModalTab('INFO');
  }, [selectedFlight]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollToCurrentFlight = () => {
    if (flights.length === 0 || search) return;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    let closestFlightId = '';
    let minDiff = Infinity;

    flights.forEach((f, idx) => {
      if (!f.scheduled_time) return;
      const [hours, minutes] = f.scheduled_time.split(':').map(Number);
      const flightMinutes = hours * 60 + minutes;
      const diff = Math.abs(currentMinutes - flightMinutes);
      
      if (diff < minDiff) {
        minDiff = diff;
        closestFlightId = `${f.flight_number}-${idx}`;
      }
    });

    if (closestFlightId && flightRefs.current[closestFlightId]) {
      flightRefs.current[closestFlightId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  const loadFlights = async (silent = false) => {
    if (!silent) setLoading(true);
    const data = await fetchFlights(activeTab);
    setFlights(data);
    if (!silent) {
        setLoading(false);
        // Scroll after small delay to ensure rendering is complete
        setTimeout(scrollToCurrentFlight, 500);
    }
  };

  useEffect(() => {
    loadFlights();
    const interval = setInterval(() => loadFlights(true), 60000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const filteredFlights = useMemo(() => {
    return flights.filter(f => 
      f.flight_number?.toLowerCase().includes(search.toLowerCase()) ||
      f.destination_city?.toLowerCase().includes(search.toLowerCase()) ||
      f.airline_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [flights, search]);

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('cancelled') || s.includes('bekor') || s.includes('delayed')) {
      return 'bg-red-500/10 text-red-600 border-red-500/20';
    }
    if (s.includes('arrival')) {
      return 'bg-[#03AC13]/10 text-[#03AC13] border-[#03AC13]/20';
    }
    if (s.includes('landed') || s.includes('qo\'ndi') || s.includes('departed') || s.includes('arrived')) {
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    }
    if (s.includes('air') || s.includes('воздухе') || s.includes('boarding')) {
      return 'bg-airport-navy/10 text-airport-navy border-airport-navy/20';
    }
    return 'bg-gray-100 text-gray-500 border-gray-200';
  };

  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-airport-light font-sans text-gray-900">
      {/* Tashkent Airport Style Header */}
      <header className="bg-airport-navy text-white py-1 md:py-1.5 px-4 md:px-6 sticky top-0 z-50 shadow-lg overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-airport-gold rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4 relative z-10 px-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2">
              <div 
                className="h-10 md:h-12 flex items-center gap-2 bg-white/5 pr-4 rounded-md border border-white/10 cursor-pointer hover:bg-white/10 transition-colors overflow-hidden"
                onClick={() => navigate('/')}
              >
                <img src="./header_logo.png" alt="Uzbekistan Airports" className="h-full w-auto object-contain" />
              </div>
            </div>
            
            {!isLandingPage && (
              <button 
                onClick={loadFlights}
                className={`md:hidden p-1.5 bg-white/5 rounded-lg border border-white/10 ${loading ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={12} />
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 md:gap-8">
            <div className="flex items-center gap-6 md:gap-12">
              <div className="flex flex-col items-start md:items-end">
                <span className="text-[8px] md:text-[11px] text-gray-400 uppercase font-black tracking-widest">Local (TAS)</span>
                <span className="text-lg md:text-3xl font-black text-white leading-none">
                  {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col items-end">
                <span className="text-[8px] md:text-[11px] text-gray-400 uppercase font-black tracking-widest">UTC</span>
                <span className="text-sm md:text-xl font-black text-airport-gold leading-none">
                  {new Date(currentTime.getTime() - (5 * 60 * 60 * 1000)).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {!isLandingPage && (
              <>
                {/* Ultra Compact Tabs */}
                <div className="flex bg-white/5 p-1 rounded-md border border-white/10">
                  {[
                    { id: 'DEPARTURE', label: 'Departures', icon: PlaneTakeoff, path: '/departures' },
                    { id: 'ARRIVAL', label: 'Arrivals', icon: PlaneLanding, path: '/arrivals' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => navigate(tab.path)}
                      className={`px-4 md:px-6 py-2 rounded-sm text-[10px] md:text-[14px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                        activeTab === tab.id 
                          ? 'bg-airport-gold text-airport-navy shadow-sm' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <tab.icon size={14} className={activeTab === tab.id ? 'text-airport-navy' : 'text-airport-gold'} />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.id === 'DEPARTURE' ? 'DEP' : 'ARR'}</span>
                    </button>
                  ))}
                </div>

                <div className="hidden lg:flex items-center gap-2">
                  <button 
                    onClick={loadFlights}
                    className={`p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10 ${loading ? 'animate-spin' : ''}`}
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Flight List Header integrated into Blue Header */}
        {!isLandingPage && (
          <div className="hidden md:grid mt-4 max-w-full mx-auto grid-cols-[0.8fr_0.8fr_0.8fr_0.8fr_1.5fr_0.6fr_0.7fr_0.7fr_1.5fr_0.7fr_0.7fr_1fr] gap-4 px-10 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 border-t border-white/10">
            <div>Scheduled</div>
            <div>Actual</div>
            <div>Flight</div>
            <div>Aircraft</div>
            <div>Airline</div>
            <div className="pl-2">STAND</div>
            <div>Plan Opp</div>
            <div>Fact Opp</div>
            <div>Delay Comment</div>
            <div>CARGO</div>
            <div>MAIL</div>
            <div className="text-right">Status</div>
          </div>
        )}
      </header>

      <main className="max-w-full mx-auto px-6 py-6">
        <Routes>
          <Route path="/" element={
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-12 py-20">
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
              >
                <h2 className="text-4xl md:text-6xl font-black text-airport-navy tracking-tighter">
                  WELCOME TO <span className="text-airport-gold">TASHKENT</span>
                </h2>
                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-sm md:text-lg">
                  International Airport Information Board
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-6">
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -5 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => navigate('/departures')}
                  className="group relative overflow-hidden bg-white border-2 border-airport-navy/5 rounded-[40px] p-12 flex flex-col items-center gap-6 shadow-xl hover:shadow-2xl hover:border-airport-gold/50 transition-all"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <PlaneTakeoff size={180} className="-rotate-12" />
                  </div>
                  <div className="w-24 h-24 bg-airport-navy rounded-3xl flex items-center justify-center shadow-lg group-hover:bg-airport-gold transition-colors">
                    <PlaneTakeoff size={48} className="text-airport-gold group-hover:text-airport-navy transition-colors" />
                  </div>
                  <div className="text-center relative z-10">
                    <h3 className="text-3xl font-black text-airport-navy mb-2">DEPARTURES</h3>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Uchib ketish ma'lumotlari</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-airport-navy font-black text-sm uppercase tracking-widest group-hover:text-airport-gold transition-colors">
                    View Schedule <ChevronRight size={16} />
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, translateY: -5 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => navigate('/arrivals')}
                  className="group relative overflow-hidden bg-airport-navy rounded-[40px] p-12 flex flex-col items-center gap-6 shadow-xl hover:shadow-2xl transition-all"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <PlaneLanding size={180} className="rotate-12" />
                  </div>
                  <div className="w-24 h-24 bg-airport-gold rounded-3xl flex items-center justify-center shadow-lg">
                    <PlaneLanding size={48} className="text-airport-navy" />
                  </div>
                  <div className="text-center relative z-10">
                    <h3 className="text-3xl font-black text-white mb-2">ARRIVALS</h3>
                    <p className="text-gray-300/60 font-bold uppercase tracking-widest text-xs">Uchib kelish ma'lumotlari</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-airport-gold font-black text-sm uppercase tracking-widest group-hover:text-white transition-colors">
                    View Schedule <ChevronRight size={16} />
                  </div>
                </motion.button>
              </div>
            </div>
          } />
          <Route path="/departures" element={
            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="bg-white h-16 rounded-xl animate-pulse border border-gray-100 shadow-sm"></div>
                ))
              ) : filteredFlights.length > 0 ? (
                filteredFlights.map((flight, idx) => {
                  const showDateSeparator = idx === 0 || flight.date !== filteredFlights[idx - 1].date;
                  
                  return (
                    <Fragment key={`${flight.flight_number}-${idx}`}>
                      {showDateSeparator && (
                        <div className="flex items-center gap-3 py-4 px-4">
                          <div className="flex-1 h-px bg-airport-navy/10" />
                          <div className="flex items-center gap-2 px-4 py-1.5 bg-airport-navy text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md border border-white/5">
                            <Calendar size={12} className="text-airport-gold" />
                            {new Date(flight.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </div>
                          <div className="flex-1 h-px bg-airport-navy/10" />
                        </div>
                      )}
                      <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        onClick={() => setSelectedFlight(flight)}
                        ref={el => flightRefs.current[`${flight.flight_number}-${idx}`] = el}
                        className={`bg-white rounded-xl p-3 md:px-10 md:py-4 border shadow-sm transition-all cursor-pointer group ${
                          // Highlight if within 15 minutes of current time
                          (() => {
                            const [h, m] = (flight.scheduled_time || "00:00").split(':').map(Number);
                            const fMin = h * 60 + m;
                            const curMin = currentTime.getHours() * 60 + currentTime.getMinutes();
                            return Math.abs(fMin - curMin) <= 15 ? 'border-airport-gold ring-2 ring-airport-gold/20 scale-[1.01] z-10' : 'border-gray-100 hover:shadow-md hover:border-airport-navy/10';
                          })()
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-[0.8fr_0.8fr_0.8fr_0.8fr_1.5fr_0.6fr_0.7fr_0.7fr_1.5fr_0.7fr_0.7fr_1fr] gap-4 items-center">
                          {/* Scheduled */}
                          <div className="flex flex-col">
                            <span className="text-lg font-black text-airport-navy">{flight.scheduled_time}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">Scheduled</span>
                          </div>

                          {/* Actual time */}
                          <div className="flex flex-col">
                            <span className={`text-lg font-black ${flight.fact ? 'text-airport-green' : 'text-airport-gold'}`}>
                              {flight.fact || '--:--'}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">Actual</span>
                          </div>

                          {/* Flight Number */}
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-black">{flight.flight_number}</span>
                          </div>

                          {/* Aircraft Type */}
                          <div className="flex flex-col">
                            <span className="text-sm font-black">{flight.aircraft_type || '---'}</span>
                          </div>

                          {/* Airline */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                              <img 
                                src={`https://images.kiwi.com/airlines/64/${flight.airline_code}.png`} 
                                alt={flight.airline_name}
                                className="w-full h-full object-contain p-1"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/plane/64/64';
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-black text-gray-800 leading-tight line-clamp-1">{flight.airline_name}</span>
                          </div>

                          {/* Stand */}
                          <div className="flex flex-col pl-2">
                            <span className="text-sm font-black">{flight.stand || '--'}</span>
                          </div>

                          {/* Plan Opp */}
                          <div className="flex flex-col">
                            <span className="text-sm font-black">{flight.plan_opposite || '--:--'}</span>
                          </div>

                          {/* Fact Opp */}
                          <div className="flex flex-col">
                            <span className="text-sm font-black">{flight.fact_opposite || '--:--'}</span>
                          </div>

                          {/* Delay Comment */}
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-red-600">{flight.delay_comment || ''}</span>
                          </div>

                          {/* Cargo */}
                          <div className="flex flex-col">
                            <span className="text-sm font-black">{flight.cargo_weight || 0} kg</span>
                          </div>

                          {/* Mail */}
                          <div className="flex flex-col">
                            <span className="text-sm font-black">{flight.mail_weight || 0} kg</span>
                          </div>

                          {/* Status */}
                          <div className="flex justify-end">
                            <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${getStatusStyle(flight.status)}`}>
                              {flight.status}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Fragment>
                  );
                })
              ) : (
                <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Info size={40} className="text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">No flights found</h3>
                  <p className="text-gray-400">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          } />
          <Route path="/arrivals" element={
            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="bg-white h-16 rounded-xl animate-pulse border border-gray-100 shadow-sm"></div>
                ))
              ) : filteredFlights.length > 0 ? (
                filteredFlights.map((flight, idx) => {
                  const showDateSeparator = idx === 0 || flight.date !== filteredFlights[idx - 1].date;
                  
                  return (
                    <Fragment key={`${flight.flight_number}-${idx}`}>
                      {showDateSeparator && (
                        <div className="flex items-center gap-3 py-4 px-4">
                          <div className="flex-1 h-px bg-airport-navy/10" />
                          <div className="flex items-center gap-2 px-4 py-1.5 bg-airport-navy text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md border border-white/5">
                            <Calendar size={12} className="text-airport-gold" />
                            {new Date(flight.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </div>
                          <div className="flex-1 h-px bg-airport-navy/10" />
                        </div>
                      )}
                      <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        onClick={() => setSelectedFlight(flight)}
                        ref={el => flightRefs.current[`${flight.flight_number}-${idx}`] = el}
                        className={`bg-white rounded-xl p-3 md:px-10 md:py-4 border shadow-sm transition-all cursor-pointer group ${
                          // Highlight if within 15 minutes of current time
                          (() => {
                            const [h, m] = (flight.scheduled_time || "00:00").split(':').map(Number);
                            const fMin = h * 60 + m;
                            const curMin = currentTime.getHours() * 60 + currentTime.getMinutes();
                            return Math.abs(fMin - curMin) <= 15 ? 'border-airport-gold ring-2 ring-airport-gold/20 scale-[1.01] z-10' : 'border-gray-100 hover:shadow-md hover:border-airport-navy/10';
                          })()
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-[0.8fr_0.8fr_0.8fr_0.8fr_1.5fr_0.6fr_0.7fr_0.7fr_1.5fr_0.7fr_0.7fr_1fr] gap-4 items-center">
                          {/* Scheduled */}
                          <div className="flex flex-col">
                            <span className="text-lg font-black text-airport-navy">{flight.scheduled_time}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">Scheduled</span>
                          </div>

                          {/* Actual time */}
                          <div className="flex flex-col">
                            <span className={`text-lg font-black ${flight.fact ? 'text-airport-green' : 'text-airport-gold'}`}>
                              {flight.fact || '--:--'}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">Actual</span>
                          </div>

                          {/* Flight Number */}
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-black">{flight.flight_number}</span>
                          </div>

                          {/* Aircraft Type */}
                          <div className="flex flex-col">
                            <span className="text-sm font-black">{flight.aircraft_type || '---'}</span>
                          </div>

                          {/* Airline */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                              <img 
                                src={`https://images.kiwi.com/airlines/64/${flight.airline_code}.png`} 
                                alt={flight.airline_name}
                                className="w-full h-full object-contain p-1"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/plane/64/64';
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-black text-gray-800 leading-tight line-clamp-1">{flight.airline_name}</span>
                          </div>

                          {/* Stand */}
                          <div className="flex flex-col pl-2">
                            <span className="text-sm font-black">{flight.stand || '--'}</span>
                          </div>

                          {/* Plan Opp */}
                          <div className="flex flex-col">
                            <span className="text-sm font-black">{flight.plan_opposite || '--:--'}</span>
                          </div>

                          {/* Fact Opp */}
                          <div className="flex flex-col">
                            <span className="text-sm font-black">{flight.fact_opposite || '--:--'}</span>
                          </div>

                          {/* Delay Comment */}
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-red-600">{flight.delay_comment || ''}</span>
                          </div>

                          {/* Cargo */}
                          <div className="flex flex-col">
                            <span className="text-sm font-black">{flight.cargo_weight || 0} kg</span>
                          </div>

                          {/* Mail */}
                          <div className="flex flex-col">
                            <span className="text-sm font-black">{flight.mail_weight || 0} kg</span>
                          </div>

                          {/* Status */}
                          <div className="flex justify-end">
                            <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${getStatusStyle(flight.status)}`}>
                              {flight.status}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Fragment>
                  );
                })
              ) : (
                <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Info size={40} className="text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">No flights found</h3>
                  <p className="text-gray-400">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Flight Detail Modal */}
      <AnimatePresence>
        {selectedFlight && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFlight(null)}
              className="absolute inset-0 bg-airport-navy/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="bg-airport-navy text-white p-10 md:p-16 pb-0 md:pb-0">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center overflow-hidden">
                      <img 
                        src={`https://images.kiwi.com/airlines/64/${selectedFlight.airline_code}.png`} 
                        alt={selectedFlight.airline_name}
                        className="w-full h-full object-contain p-2"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h3 className="text-5xl font-black tracking-tighter">{selectedFlight.flight_number}</h3>
                      <p className="text-lg text-gray-300 font-bold uppercase tracking-widest">{selectedFlight.airline_name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedFlight(null)}
                    className="p-4 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={32} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-8 mb-12">
                  <div className="flex-1">
                    <p className="text-[12px] text-gray-400 font-black uppercase tracking-widest mb-3">From</p>
                    <h4 className="text-6xl font-black mb-2">TAS</h4>
                    <p className="text-xl font-bold text-gray-300">Tashkent Int'l</p>
                  </div>
                  <div className="flex flex-col items-center gap-4 px-8">
                    <ArrowRight className="text-airport-gold" size={48} />
                    <div className={`px-6 py-2 rounded-full border text-[12px] font-black uppercase ${getStatusStyle(selectedFlight.status)}`}>
                      {selectedFlight.status}
                    </div>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-[12px] text-gray-400 font-black uppercase tracking-widest mb-3">To</p>
                    <h4 className="text-6xl font-black mb-2">{selectedFlight.destination_code}</h4>
                    <p className="text-xl font-bold text-gray-300 truncate">{selectedFlight.destination_city}</p>
                  </div>
                </div>

                {/* Modal Tabs */}
                <div className="flex gap-12 border-b border-white/10">
                  <button 
                    onClick={() => setModalTab('INFO')}
                    className={`pb-6 text-sm font-black uppercase tracking-widest transition-all relative ${modalTab === 'INFO' ? 'text-airport-gold' : 'text-gray-400 hover:text-gray-200'}`}
                  >
                    Flight Info
                    {modalTab === 'INFO' && <motion.div layoutId="modalTab" className="absolute bottom-0 left-0 right-0 h-1.5 bg-airport-gold" />}
                  </button>
                  <button 
                    onClick={() => setModalTab('CARGO')}
                    className={`pb-6 text-sm font-black uppercase tracking-widest transition-all relative ${modalTab === 'CARGO' ? 'text-airport-gold' : 'text-gray-400 hover:text-gray-200'}`}
                  >
                    Cargo Details
                    {modalTab === 'CARGO' && <motion.div layoutId="modalTab" className="absolute bottom-0 left-0 right-0 h-1.5 bg-airport-gold" />}
                  </button>
                </div>
              </div>

              <div className="p-10 md:p-16">
                {modalTab === 'INFO' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
                    <div className="space-y-2">
                      <p className="text-[12px] text-gray-400 font-black uppercase tracking-widest">Scheduled Time</p>
                      <p className="text-3xl font-black text-airport-navy">{selectedFlight.scheduled_time}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[12px] text-gray-400 font-black uppercase tracking-widest">Actual Time</p>
                      <p className={`text-3xl font-black ${selectedFlight.fact ? 'text-airport-green' : 'text-airport-gold'}`}>
                        {selectedFlight.fact || '--:--'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[12px] text-gray-400 font-black uppercase tracking-widest">Plan Opp</p>
                      <p className="text-3xl font-black text-gray-600">{selectedFlight.plan_opposite || '--:--'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[12px] text-gray-400 font-black uppercase tracking-widest">Fact Opp</p>
                      <p className="text-3xl font-black text-gray-600">{selectedFlight.fact_opposite || '--:--'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[12px] text-gray-400 font-black uppercase tracking-widest">UTC Time</p>
                      <p className="text-3xl font-black text-gray-600">{selectedFlight.utc_time || '--:--'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[12px] text-gray-400 font-black uppercase tracking-widest">Aircraft</p>
                      <p className="text-3xl font-black text-gray-600">{selectedFlight.aircraft_type || '---'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[12px] text-gray-400 font-black uppercase tracking-widest">Terminal</p>
                      <p className="text-3xl font-black text-gray-600">T2</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[12px] text-gray-400 font-black uppercase tracking-widest">Tail Number</p>
                      <p className="text-3xl font-black text-gray-600">{selectedFlight.tail_number || '---'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-3xl border border-gray-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-[12px] font-black uppercase tracking-widest text-gray-400">
                          <th className="px-8 py-6">Item Type</th>
                          <th className="px-8 py-6">Weight (kg)</th>
                          <th className="px-8 py-6">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr>
                          <td className="px-8 py-6 text-xl font-bold">General Cargo</td>
                          <td className="px-8 py-6 text-xl font-mono font-bold">{selectedFlight.cargo_weight || 0} kg</td>
                          <td className="px-8 py-6">
                            <span className="px-4 py-2 bg-green-50 text-green-600 text-[12px] font-black rounded-full">LOADED</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-8 py-6 text-xl font-bold">Mail</td>
                          <td className="px-8 py-6 text-xl font-mono font-bold">{selectedFlight.mail_weight || 0} kg</td>
                          <td className="px-8 py-6">
                            <span className="px-4 py-2 bg-green-50 text-green-600 text-[12px] font-black rounded-full">LOADED</span>
                          </td>
                        </tr>
                        <tr className="bg-gray-50/50">
                          <td className="px-8 py-6 font-black uppercase text-sm">Total Payload</td>
                          <td className="px-8 py-6 font-mono font-black text-3xl">
                            {(selectedFlight.cargo_weight || 0) + (selectedFlight.mail_weight || 0)} kg
                          </td>
                          <td className="px-8 py-6"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="p-10 bg-gray-50 flex justify-center">
                <button 
                  onClick={() => setSelectedFlight(null)}
                  className="bg-airport-navy text-white px-16 py-6 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-airport-gold hover:text-airport-navy transition-all shadow-lg"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="bg-airport-navy text-white py-20 px-10">
        <div className="max-w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-16">
          <div className="flex items-center gap-6">
            <div className="h-16 md:h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden p-2">
              <img src="./header_logo.png" alt="Uzbekistan Airports" className="h-full w-auto object-contain" />
            </div>
          </div>
          <div className="flex gap-16 text-sm font-black uppercase tracking-widest text-gray-400">
            <a href="#" className="hover:text-airport-gold transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-airport-gold transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-airport-gold transition-colors">Contact Us</a>
          </div>
          <p className="text-[12px] text-gray-500 font-black uppercase tracking-widest">© 2026 Tashkent International Airport. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
