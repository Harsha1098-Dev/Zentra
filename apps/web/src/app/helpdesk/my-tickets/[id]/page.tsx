'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Ticket,
  Clock,
  Send,
  Star,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  User,
  Shield,
  MessageSquare,
} from 'lucide-react';
import { HelpdeskNav } from '../../helpdesk-nav';
import { ApiClient } from '../../../../lib/api';

export default function MyTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // CSAT rating state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [csatComment, setCsatComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadTicket() {
    try {
      setLoading(true);
      const res = await ApiClient.request(`/me/tickets/${ticketId}`);
      setTicket(res);
      if (res?.feedback) {
        setRating(res.feedback.rating);
        setCsatComment(res.feedback.comment || '');
        setFeedbackSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    try {
      setSendingReply(true);
      await ApiClient.request(`/me/tickets/${ticketId}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          message: replyMessage.trim(),
        }),
      });
      setReplyMessage('');
      await loadTicket();
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingFeedback(true);
      await ApiClient.request(`/me/tickets/${ticketId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          comment: csatComment.trim() || null,
        }),
      });
      setFeedbackSuccess(true);
      await loadTicket();
    } catch (err: any) {
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB]">
        <HelpdeskNav />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-xs text-slate-400">
          Loading ticket details...
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#F6F8FB]">
        <HelpdeskNav />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900 mt-2">Ticket Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">{errorMsg || 'Unable to find ticket'}</p>
          <Link
            href="/helpdesk/my-tickets"
            className="inline-block mt-4 text-xs font-semibold text-[#1E3A8A] hover:underline"
          >
            &larr; Back to my tickets
          </Link>
        </div>
      </div>
    );
  }

  const isResolvedOrClosed = ['RESOLVED', 'CLOSED'].includes(ticket.ticketStatus);

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <HelpdeskNav />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/helpdesk/my-tickets"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#1E3A8A]"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to My Tickets
        </Link>

        {/* Ticket Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-sm font-bold text-[#1E3A8A] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                {ticket.ticketNumber}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {ticket.ticketStatus}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {ticket.priority} Priority
              </span>
            </div>

            <div className="text-xs text-slate-400">
              Submitted on {new Date(ticket.createdAt).toLocaleString()}
            </div>
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900">{ticket.subject}</h1>
            <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              {ticket.description}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Category</span>
              <span className="font-semibold text-slate-800">
                {ticket.helpdeskCategory?.name}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Assigned Agent</span>
              <span className="font-semibold text-slate-800">
                {ticket.assignedAgent?.user
                  ? `${ticket.assignedAgent.user.firstName} ${ticket.assignedAgent.user.lastName}`
                  : 'Pending Assignment'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Resolution Target</span>
              <span className="font-semibold text-slate-800">
                {ticket.slaResolutionDueAt
                  ? new Date(ticket.slaResolutionDueAt).toLocaleDateString()
                  : 'Standard SLA'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Last Updated</span>
              <span className="font-semibold text-slate-800">
                {new Date(ticket.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* CSAT Rating Banner on Resolved / Closed */}
        {isResolvedOrClosed && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">
                {feedbackSuccess || ticket.feedback
                  ? 'Your Satisfaction Rating'
                  : 'How was our service?'}
              </h3>
            </div>

            {feedbackSuccess || ticket.feedback ? (
              <div className="space-y-1.5 mt-2">
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= (ticket.satisfactionRating || rating)
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {ticket.satisfactionRating || rating} out of 5 stars
                  </span>
                </div>
                {(ticket.satisfactionComment || csatComment) && (
                  <p className="text-xs text-slate-600 italic">
                    "{ticket.satisfactionComment || csatComment}"
                  </p>
                )}
                <p className="text-[11px] text-emerald-700 font-medium pt-1">
                  &check; Thank you for your feedback!
                </p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-3 mt-2">
                <p className="text-xs text-slate-600">
                  This ticket has been marked as resolved. Please rate the support you received:
                </p>

                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none transition transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (hoverRating ?? rating)
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-slate-700 ml-2">
                    {rating === 5
                      ? 'Excellent'
                      : rating === 4
                      ? 'Good'
                      : rating === 3
                      ? 'Average'
                      : rating === 2
                      ? 'Poor'
                      : 'Very Poor'}
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="Optional: What went well or what could we improve?"
                  value={csatComment}
                  onChange={(e) => setCsatComment(e.target.value)}
                  className="w-full text-xs border border-amber-300 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                />

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="px-4 py-1.5 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-blue-800 transition"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Rating'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Conversation Thread */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-[#1E3A8A]" />
              <h2 className="text-sm font-bold text-slate-900">Conversation Thread</h2>
            </div>
            <span className="text-xs text-slate-400">
              {ticket.conversations?.length || 0} messages
            </span>
          </div>

          <div className="p-6 space-y-4">
            {ticket.conversations && ticket.conversations.length > 0 ? (
              ticket.conversations.map((msg: any) => {
                const isEmployee = msg.authorType === 'EMPLOYEE';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isEmployee ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-slate-700">
                        {isEmployee
                          ? 'You'
                          : `${msg.author?.firstName || 'Support'} ${msg.author?.lastName || 'Agent'}`}
                      </span>
                      <span>&bull;</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-xl rounded-xl p-3.5 text-xs ${
                        isEmployee
                          ? 'bg-[#1E3A8A] text-white rounded-tr-none'
                          : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No replies yet. An agent will respond shortly.
              </div>
            )}
          </div>

          {/* Reply Box */}
          {!['CLOSED', 'CANCELLED'].includes(ticket.ticketStatus) ? (
            <form onSubmit={handleSendReply} className="p-4 bg-slate-50 border-t border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Add your reply
              </label>
              <div className="flex space-x-2">
                <textarea
                  rows={2}
                  placeholder="Type a message or answer requested information..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyMessage.trim()}
                  className="px-4 bg-[#1E3A8A] text-white rounded-lg flex items-center justify-center hover:bg-blue-800 disabled:opacity-40 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
              This ticket is closed. If you need further help, please submit a new ticket.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
