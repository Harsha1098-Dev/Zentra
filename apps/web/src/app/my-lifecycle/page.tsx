'use client';

import React, { useEffect, useState } from 'react';
import { MyLifecycleNav } from './my-lifecycle-nav';
import { ApiClient } from '../../lib/api';
import { useAuth } from '../../context/auth-context';
import {
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRightLeft,
  DollarSign,
  Briefcase,
  Calendar,
  Building,
  MapPin,
} from 'lucide-react';

export default function MyLifecycleTimelinePage() {
  const { activeOrganization } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [employee, setEmployee] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeOrganization) {
      loadProfileAndHistory();
    }
  }, [activeOrganization]);

  const loadProfileAndHistory = async () => {
    setLoading(true);
    try {
      const empData = await ApiClient.get('/employees/me');
      setEmployee(empData);
      if (empData?.id) {
        const histData = await ApiClient.get(`/employees/${empData.id}/history`);
        setHistory(Array.isArray(histData) ? histData : []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'PROMOTION':
      case 'PROMOTED':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'TRANSFER':
      case 'TRANSFERRED':
        return <ArrowRightLeft className="w-4 h-4 text-indigo-600" />;
      case 'COMPENSATION_CHANGE':
        return <DollarSign className="w-4 h-4 text-teal-600" />;
      case 'PROBATION_CONFIRMED':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      default:
        return <Briefcase className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <MyLifecycleNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            My Career & Progression Timeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your journey at {activeOrganization?.name || 'Zentra'}, including probation confirmations, internal transfers, and role promotions.
          </p>
        </div>

        {/* Current Role Overview Card */}
        {employee && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Current Position
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-2">
                  {employee.designation?.name || 'Designation'}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center space-x-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{employee.department?.name || 'Department'}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{employee.location?.name || 'Location'}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Joined {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : 'N/A'}</span>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {employee.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Career Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-6 pb-3 border-b border-slate-100">
            Chronological Progression
          </h3>

          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading timeline...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No transition history events recorded yet.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
              {history.map((item, idx) => (
                <div key={item.id || idx} className="relative pl-6">
                  {/* Dot */}
                  <div className="absolute -left-2.5 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  </div>

                  <div className="bg-slate-50/70 rounded-lg p-4 border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        {getEventIcon(item.eventType)}
                        <span className="text-xs font-bold text-slate-900">
                          {item.eventType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(item.effectiveFrom).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">{item.remarks || 'Status update'}</p>

                    {item.newValues && typeof item.newValues === 'object' && (
                      <div className="mt-2 text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-100">
                        {Object.entries(item.newValues).map(([k, v]) => (
                          <div key={k} className="flex justify-between py-0.5">
                            <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="font-semibold text-slate-800">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
