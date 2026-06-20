import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import api from '../api';

interface Doctor {
  id: string;
  full_name: string;
  specialty: string;
  bio: string | null;
  years_experience: number;
  cv_summary: string | null;
}

const DEFAULT_SPECIALTIES = [
  'General Practitioner',
  'Cardiologist',
  'Neurologist',
  'Dermatologist',
  'Pediatrician',
  'Orthopedist',
  'Psychiatrist'
];

export default function Doctors() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const specialtyParam = searchParams.get('specialty') || '';
  const triageSessionId = searchParams.get('triage_session_id');

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(specialtyParam);

  // Ensure the selected specialty from URL is in the dropdown if it's not a default one
  const specialtyOptions = Array.from(new Set([...DEFAULT_SPECIALTIES, selectedSpecialty].filter(Boolean)));

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialty]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedSpecialty) {
        params.specialty = selectedSpecialty;
      }
      const response = await api.get('/doctors', { params });
      setDoctors(response.data);
    } catch (err) {
      console.error('Failed to fetch doctors', err);
      setError('Failed to load doctors. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSpecialty = e.target.value;
    setSelectedSpecialty(newSpecialty);
    
    const newParams = new URLSearchParams(searchParams);
    if (newSpecialty) {
      newParams.set('specialty', newSpecialty);
    } else {
      newParams.delete('specialty');
    }
    setSearchParams(newParams);
  };

  const handleRequestAppointment = (doctorId: string) => {
    const params = new URLSearchParams();
    params.set('doctor_id', doctorId);
    if (triageSessionId) {
      params.set('triage_session_id', triageSessionId);
    }
    navigate(`/appointments/request?${params.toString()}`);
  };

  const filteredDoctors = doctors.filter(doc => 
    doc.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SidebarLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Find a Doctor</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input 
            type="text" 
            placeholder="Search by name..." 
            data-element-id="search-input"
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            data-element-id="specialty-filter"
            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white shadow-sm sm:w-64"
            value={selectedSpecialty}
            onChange={handleSpecialtyChange}
          >
            <option value="">All Specialties</option>
            {specialtyOptions.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading doctors...</div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-500 shadow-sm">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-lg font-medium text-slate-600">No doctors found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDoctors.map((doc, index) => (
              <div 
                key={doc.id} 
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-6 hover:shadow-md transition-shadow"
                data-element-id={`doctor-${index + 1}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-slate-900">{doc.full_name}</h3>
                    <span className="px-2.5 py-0.5 bg-sky-100 text-sky-700 text-xs font-medium rounded-full">
                      {doc.specialty}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mb-3 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {doc.years_experience} years experience
                  </div>
                  {doc.bio && (
                    <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">{doc.bio}</p>
                  )}
                  {doc.cv_summary && !doc.bio && (
                    <p className="text-sm text-slate-600 leading-relaxed max-w-3xl italic">{doc.cv_summary}</p>
                  )}
                </div>
                <button 
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors whitespace-nowrap mt-2 sm:mt-0 shadow-sm"
                  data-element-id={`request-btn-${index + 1}`}
                  onClick={() => handleRequestAppointment(doc.id)}
                >
                  Request Appointment
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
