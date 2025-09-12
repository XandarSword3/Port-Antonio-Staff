'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Reservation } from '../types';
import { 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  CheckCircle, 
  XCircle, 
  UserCheck,
  AlertCircle,
  Star,
  Award
} from 'lucide-react';

export default function ReservationManager() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(200);
  const [loyaltyReason, setLoyaltyReason] = useState('');

  useEffect(() => {
    let mounted = true;
    
    const loadReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/reservations');
        if (!response.ok) {
          const errorText = await response.text();
          console.warn('Reservations API returned error:', response.status, errorText);
          
          if (mounted) {
            setReservations([]);
            setError(`Unable to load reservations (Status: ${response.status}). The reservations system may be unavailable.`);
          }
          return;
        }
        
        const data = await response.json();
        if (mounted) {
          setReservations(data.reservations || []);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching reservations:', err);
        if (mounted) {
          setReservations([]);
          setError('Failed to load reservations. Please try again later.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadReservations();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      mounted = false;
    };
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      
      const response = await fetch('/api/reservations');
      if (!response.ok) {
        // Instead of throwing, handle the error gracefully
        const errorText = await response.text();
        console.warn('Reservations API returned error:', response.status, errorText);
        
        // Set empty reservations instead of throwing
        setReservations([]);
        setError(`Unable to load reservations (Status: ${response.status}). The reservations system may be unavailable.`);
        return;
      }
      
      const data = await response.json();
      setReservations(data.reservations || []);
      setError(null); // Clear error on success
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setReservations([]); // Prevent undefined state
      setError('Failed to load reservations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (id: string, action: string, additionalData?: any) => {
    try {
      setActionLoading(id);
      const response = await fetch(`/api/reservations/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(additionalData || {})
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${action} reservation`);
      }

      const result = await response.json();
      
      // Update local state
      setReservations(prev => 
        prev.map(r => r.id === id ? { ...r, ...result.reservation } : r)
      );

      // Show success message if loyalty points were awarded
      if (result.loyalty) {
        alert(`Reservation completed! ${result.loyalty.pointsAwarded} loyalty points awarded.`);
      }

    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualLoyaltyAward = async () => {
    if (!selectedReservation || !loyaltyReason.trim()) return;

    try {
      setActionLoading('loyalty');
      const response = await fetch('/api/loyalty/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: selectedReservation.customerEmail,
          phone: selectedReservation.customerPhone,
          points: loyaltyPoints,
          reason: loyaltyReason,
          referenceType: 'manual_reservation',
          referenceId: selectedReservation.id,
          metadata: {
            customer_name: selectedReservation.customerName,
            reservation_date: selectedReservation.date,
            awarded_by: `${user?.firstName} ${user?.lastName}`
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to award loyalty points');
      }

      const result = await response.json();
      alert(`Successfully awarded ${loyaltyPoints} points! ${result.message}`);
      setShowLoyaltyModal(false);
      setLoyaltyReason('');
      
    } catch (err) {
      alert(`Error awarding points: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'reminded': return 'text-blue-600 bg-blue-100';
      case 'arrived': return 'text-purple-600 bg-purple-100';
      case 'completed': return 'text-green-700 bg-green-200';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'no_show': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    if (filter === 'all') return true;
    return reservation.status === filter;
  });

  const getActionButtons = (reservation: Reservation) => {
    const buttons = [];
    const isLoading = actionLoading === reservation.id;

    switch (reservation.status) {
      case 'pending':
        buttons.push(
          <button
            key="confirm"
            onClick={() => updateReservationStatus(reservation.id, 'confirm')}
            disabled={isLoading}
            className="flex items-center px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Confirm
          </button>
        );
        break;
      
      case 'confirmed':
      case 'reminded':
        buttons.push(
          <button
            key="arrived"
            onClick={() => {
              const tableNumber = prompt('Table number (optional):');
              updateReservationStatus(reservation.id, 'mark-arrived', { tableNumber });
            }}
            disabled={isLoading}
            className="flex items-center px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Mark Arrived
          </button>
        );
        break;
      
      case 'arrived':
        buttons.push(
          <button
            key="complete"
            onClick={() => updateReservationStatus(reservation.id, 'mark-completed')}
            disabled={isLoading}
            className="flex items-center px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 disabled:opacity-50"
          >
            <Star className="h-4 w-4 mr-1" />
            Mark Completed
          </button>
        );
        break;
    }

    // Cancel button for non-completed/cancelled reservations
    if (!['completed', 'cancelled', 'no_show'].includes(reservation.status)) {
      buttons.push(
        <button
          key="cancel"
          onClick={() => {
            const reason = prompt('Cancellation reason (optional):');
            updateReservationStatus(reservation.id, 'cancel', { reason });
          }}
          disabled={isLoading}
          className="flex items-center px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
        >
          <XCircle className="h-4 w-4 mr-1" />
          Cancel
        </button>
      );
    }

    // Manual loyalty award button for admin/owner
    if ((user?.role === 'admin' || user?.role === 'owner') && 
        (reservation.customerEmail || reservation.customerPhone)) {
      buttons.push(
        <button
          key="loyalty"
          onClick={() => {
            setSelectedReservation(reservation);
            setShowLoyaltyModal(true);
          }}
          className="flex items-center px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
        >
          <Award className="h-4 w-4 mr-1" />
          Award Points
        </button>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading reservations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Reservation Management</h2>
          <button
            onClick={fetchReservations}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
        
        {/* Filter tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'arrived', label: 'Arrived' },
            { key: 'completed', label: 'Completed' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Reservations table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {reservation.customerName}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center space-x-2">
                        {reservation.customerEmail && (
                          <span className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {reservation.customerEmail}
                          </span>
                        )}
                        {reservation.customerPhone && (
                          <span className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {reservation.customerPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {new Date(reservation.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      {reservation.time}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      {reservation.partySize}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                      {reservation.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reservation.tableNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {getActionButtons(reservation)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReservations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No reservations found for the selected filter.
          </div>
        )}
      </div>

      {/* Manual Loyalty Points Modal */}
      {showLoyaltyModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Award Loyalty Points</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Customer: <strong>{selectedReservation.customerName}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                {selectedReservation.customerEmail || selectedReservation.customerPhone}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points to Award
              </label>
              <input
                type="number"
                value={loyaltyPoints}
                onChange={(e) => setLoyaltyPoints(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (required)
              </label>
              <input
                type="text"
                value={loyaltyReason}
                onChange={(e) => setLoyaltyReason(e.target.value)}
                placeholder="e.g., Special occasion bonus, service recovery"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleManualLoyaltyAward}
                disabled={actionLoading === 'loyalty' || !loyaltyReason.trim()}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
              >
                {actionLoading === 'loyalty' ? 'Awarding...' : 'Award Points'}
              </button>
              <button
                onClick={() => {
                  setShowLoyaltyModal(false);
                  setLoyaltyReason('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
