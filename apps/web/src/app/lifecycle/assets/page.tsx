'use client';

import React, { useEffect, useState } from 'react';
import { LifecycleNav } from '../lifecycle-nav';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  Package,
  PlusCircle,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Laptop,
  CreditCard,
  Monitor,
} from 'lucide-react';
import { AssetType, AssetCondition, AssetReturnStatus } from '@zentra/shared-types';

export default function AssetsPage() {
  const { activeOrganization } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New asset modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>(AssetType.LAPTOP);
  const [assetSerialNumber, setAssetSerialNumber] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [assetCondition, setAssetCondition] = useState<AssetCondition>(AssetCondition.NEW);
  const [comments, setComments] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Return modal
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [returnCondition, setReturnCondition] = useState<AssetCondition>(AssetCondition.GOOD);
  const [returnComments, setReturnComments] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);

  useEffect(() => {
    if (activeOrganization) {
      loadData();
    }
  }, [activeOrganization]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [astData, empData] = await Promise.all([
        ApiClient.get('/assets').catch(() => []),
        ApiClient.get('/employees').catch(() => []),
      ]);
      setAssets(Array.isArray(astData) ? astData : []);
      setEmployees(Array.isArray(empData) ? empData : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await ApiClient.post('/assets', {
        assetName,
        assetType,
        assetSerialNumber,
        assignedEmployeeId: assigneeId || undefined,
        assetCondition,
        comments: comments || undefined,
      });

      setShowCreateModal(false);
      setAssetName('');
      setAssetSerialNumber('');
      setAssigneeId('');
      setComments('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add asset');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    setReturnLoading(true);
    try {
      await ApiClient.post(`/assets/${selectedAsset.id}/return`, {
        assetCondition: returnCondition,
        comments: returnComments || undefined,
      });

      setSelectedAsset(null);
      setReturnComments('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to record asset return');
    } finally {
      setReturnLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await ApiClient.delete(`/assets/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete asset');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <LifecycleNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Company Assets & Hardware Inventory
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track laptop serials, monitors, mobile devices, and access badges with condition logs upon assignment and exit returns.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Asset</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            Loading asset inventory...
          </div>
        ) : assets.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No assets in inventory</h3>
            <p className="text-xs text-slate-500 mt-1">Register laptops, cards, and accessories.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Add First Asset
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Asset Details</th>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4">Current Assignee</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {assets.map((a) => {
                  const isAssigned = a.returnStatus === 'ASSIGNED';
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{a.assetName}</div>
                        <div className="text-[11px] text-slate-400">{a.assetType}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">
                        {a.assetSerialNumber}
                      </td>
                      <td className="py-3 px-4">
                        {a.assignedTo ? (
                          <div>
                            <span className="font-semibold text-slate-900">
                              {a.assignedTo.firstName} {a.assignedTo.lastName}
                            </span>
                            <div className="text-[11px] text-slate-400">{a.assignedTo.employeeCode}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned (In Stock)</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          a.assetCondition === 'NEW'
                            ? 'bg-blue-50 text-blue-700'
                            : a.assetCondition === 'GOOD'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {a.assetCondition}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isAssigned
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {a.returnStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isAssigned && (
                            <button
                              onClick={() => {
                                setSelectedAsset(a);
                                setReturnCondition(AssetCondition.GOOD);
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded font-semibold text-[11px]"
                            >
                              <RotateCcw className="w-3 h-3 text-slate-500" />
                              <span>Record Return</span>
                            </button>
                          )}
                          {!isAssigned && (
                            <button
                              onClick={() => handleDelete(a.id)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Asset Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Add Asset to Inventory</h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Register new hardware or access credentials with serial number.
              </p>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Asset Name / Model *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MacBook Pro 16-inch M3 Max"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Asset Type *
                    </label>
                    <select
                      value={assetType}
                      onChange={(e: any) => setAssetType(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={AssetType.LAPTOP}>Laptop</option>
                      <option value={AssetType.MONITOR}>Monitor</option>
                      <option value={AssetType.MOBILE}>Mobile Device</option>
                      <option value={AssetType.ACCESS_CARD}>Access Card</option>
                      <option value={AssetType.ID_CARD}>ID Card</option>
                      <option value={AssetType.ACCESSORY}>Accessory</option>
                      <option value={AssetType.OTHER}>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Serial Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. C02G1234MD6R"
                      value={assetSerialNumber}
                      onChange={(e) => setAssetSerialNumber(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign to Employee (Optional)
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Keep in Unassigned Stock</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-1.5 text-xs bg-[#1E3A8A] text-white rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50"
                  >
                    {createLoading ? 'Saving...' : 'Add Asset'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Return Asset Modal */}
        {selectedAsset && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Record Asset Return</h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Record the return of <span className="font-semibold text-slate-800">{selectedAsset.assetName}</span> from {selectedAsset.assignedTo?.firstName} {selectedAsset.assignedTo?.lastName}.
              </p>

              <form onSubmit={handleReturn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Returned Condition *
                  </label>
                  <select
                    value={returnCondition}
                    onChange={(e: any) => setReturnCondition(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={AssetCondition.GOOD}>Good (Minor wear and tear)</option>
                    <option value={AssetCondition.NEW}>Like New</option>
                    <option value={AssetCondition.DAMAGED}>Damaged (Requires repair)</option>
                    <option value={AssetCondition.LOST}>Lost / Unaccounted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condition Notes / Handover Inspection Remarks
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Charger cable returned, no screen damage..."
                    value={returnComments}
                    onChange={(e) => setReturnComments(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedAsset(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={returnLoading}
                    className="px-4 py-1.5 text-xs bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {returnLoading ? 'Saving...' : 'Confirm Return'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
