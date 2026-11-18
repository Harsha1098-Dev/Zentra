'use client';

import React, { useState } from 'react';
import {
  Users2,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  ListTodo,
  FileText,
  CheckSquare,
  Square,
  X,
  User,
  ChevronRight,
} from 'lucide-react';
import { PerformanceNav } from '../performance-nav';

interface ActionItem {
  id: string;
  title: string;
  assignee: string;
  isCompleted: boolean;
  dueDate?: string;
}

interface Meeting {
  id: string;
  partnerName: string;
  partnerRole: string;
  scheduledAt: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  agenda: string[];
  notes: string;
  actionItems: ActionItem[];
}

export default function OneOnOnePage() {
  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: 'm-1',
      partnerName: 'Marcus Vance (Manager)',
      partnerRole: 'VP of Engineering',
      scheduledAt: '2026-03-24T14:00:00Z',
      status: 'SCHEDULED',
      agenda: [
        'Review Q1 OKR milestones & Redis caching progress',
        'Discussion on Staff Engineer promotion criteria',
        'Workload balancing & upcoming sprint priorities',
      ],
      notes: '',
      actionItems: [
        {
          id: 'act-1',
          title: 'Draft RFC for cross-region data replication',
          assignee: 'Sarah Jenkins',
          isCompleted: false,
          dueDate: '2026-03-30',
        },
        {
          id: 'act-2',
          title: 'Schedule compensation benchmarking review with HR',
          assignee: 'Marcus Vance',
          isCompleted: true,
          dueDate: '2026-03-20',
        },
      ],
    },
    {
      id: 'm-2',
      partnerName: 'Alex Rivera (Direct Report)',
      partnerRole: 'Frontend Software Engineer',
      scheduledAt: '2026-03-18T10:00:00Z',
      status: 'COMPLETED',
      agenda: [
        'Sprint 15 velocity and UI component test coverage',
        'Feedback on design token refactor',
      ],
      notes:
        'Alex demonstrated the new component library. Velocity has improved by 20%. Advised on optimizing bundle size using dynamic imports.',
      actionItems: [
        {
          id: 'act-3',
          title: 'Set up Lighthouse CI in GitHub Actions workflow',
          assignee: 'Alex Rivera',
          isCompleted: true,
          dueDate: '2026-03-22',
        },
      ],
    },
  ]);

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting>(meetings[0]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    partnerName: '',
    partnerRole: 'Colleague',
    scheduledAt: '',
    agendaText: '',
  });

  const [newActionTitle, setNewActionTitle] = useState('');

  const toggleActionItem = (meetingId: string, actionId: string) => {
    const updatedMeetings = meetings.map((m) => {
      if (m.id !== meetingId) return m;
      const updatedActions = m.actionItems.map((a) =>
        a.id === actionId ? { ...a, isCompleted: !a.isCompleted } : a
      );
      return { ...m, actionItems: updatedActions };
    });
    setMeetings(updatedMeetings);
    if (selectedMeeting.id === meetingId) {
      setSelectedMeeting({
        ...selectedMeeting,
        actionItems: selectedMeeting.actionItems.map((a) =>
          a.id === actionId ? { ...a, isCompleted: !a.isCompleted } : a
        ),
      });
    }
  };

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTitle.trim()) return;

    const newAction: ActionItem = {
      id: `act-${Date.now()}`,
      title: newActionTitle.trim(),
      assignee: selectedMeeting.partnerName.includes('Manager')
        ? 'Sarah Jenkins'
        : selectedMeeting.partnerName,
      isCompleted: false,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    };

    const updated = {
      ...selectedMeeting,
      actionItems: [...selectedMeeting.actionItems, newAction],
    };

    setSelectedMeeting(updated);
    setMeetings(meetings.map((m) => (m.id === updated.id ? updated : m)));
    setNewActionTitle('');
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newM: Meeting = {
      id: `m-${Date.now()}`,
      partnerName: scheduleForm.partnerName,
      partnerRole: scheduleForm.partnerRole,
      scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
      status: 'SCHEDULED',
      agenda: scheduleForm.agendaText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      notes: '',
      actionItems: [],
    };
    setMeetings([newM, ...meetings]);
    setSelectedMeeting(newM);
    setIsScheduleModalOpen(false);
    setScheduleForm({
      partnerName: '',
      partnerRole: 'Colleague',
      scheduledAt: '',
      agendaText: '',
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PerformanceNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">1:1 Meetings & Syncs</h1>
            <p className="text-sm text-slate-500 mt-1">
              Collaborative agendas, private notes, and actionable task commitments.
            </p>
          </div>

          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="inline-flex items-center space-x-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule 1:1</span>
          </button>
        </div>

        {/* 2-column Layout: Meeting List on left, Meeting details & actions on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Meeting list */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Meetings ({meetings.length})
            </h2>

            <div className="space-y-2">
              {meetings.map((m) => {
                const isSelected = selectedMeeting.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMeeting(m)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-500/20 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                          {m.partnerName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{m.partnerName}</p>
                          <p className="text-[11px] text-slate-500">{m.partnerRole}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(m.scheduledAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <span>{m.actionItems.length} action items</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Meeting Workspace */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedMeeting.partnerName}</h2>
                <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(selectedMeeting.scheduledAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-blue-900">{selectedMeeting.status}</span>
                </div>
              </div>

              {selectedMeeting.status === 'SCHEDULED' && (
                <button
                  onClick={() => {
                    const updated = { ...selectedMeeting, status: 'COMPLETED' as const };
                    setSelectedMeeting(updated);
                    setMeetings(meetings.map((m) => (m.id === updated.id ? updated : m)));
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark as Completed</span>
                </button>
              )}
            </div>

            {/* Agenda section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                <ListTodo className="w-4 h-4 text-blue-600" />
                <span>Discussion Agenda & Talking Points</span>
              </h3>
              <ul className="space-y-2">
                {selectedMeeting.agenda.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start space-x-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100"
                  >
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Meeting Notes */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>Notes & Key Decisions</span>
              </h3>
              <textarea
                rows={3}
                placeholder="Record key takeaways, decisions made, or points to revisit..."
                value={selectedMeeting.notes}
                onChange={(e) => {
                  const updated = { ...selectedMeeting, notes: e.target.value };
                  setSelectedMeeting(updated);
                  setMeetings(meetings.map((m) => (m.id === updated.id ? updated : m)));
                }}
                className="w-full border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Action Items synchronized with tasks */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>Action Commitments (Synced to Tasks)</span>
                </h3>
              </div>

              <div className="space-y-2">
                {selectedMeeting.actionItems.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => toggleActionItem(selectedMeeting.id, act.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      act.isCompleted
                        ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      {act.isCompleted ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <span className="font-medium">{act.title}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                      <span>Owner: {act.assignee}</span>
                      {act.dueDate && <span>Due: {act.dueDate}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add action item form */}
              <form onSubmit={handleAddAction} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add a new action item..."
                  value={newActionTitle}
                  onChange={(e) => setNewActionTitle(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs"
                >
                  Add Action
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Schedule 1:1 Meeting</h2>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting With</label>
                <input
                  type="text"
                  required
                  placeholder="Manager or direct report name..."
                  value={scheduleForm.partnerName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, partnerName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleForm.scheduledAt}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agenda Topics (one per line)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Sprint goals update&#10;Architecture RFC review&#10;Career planning..."
                  value={scheduleForm.agendaText}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, agendaText: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Schedule Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
