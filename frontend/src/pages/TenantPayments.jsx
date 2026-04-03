import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import TenantSidebar from '../components/TenantSidebar';
import {
    Search, ChevronDown, CheckCircle2, Clock, Wallet,
    CreditCard, DollarSign, Calendar, AlertCircle, ExternalLink, Filter, XCircle
} from 'lucide-react';
import { paymentService } from '../services/tenantService';

export default function TenantPayments({ user }) {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    // filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [timeFilter, setTimeFilter] = useState('All Time');
    // banner shown during payment verification
    const [verificationMessage, setVerificationMessage] = useState(null);
    const [verificationStatus, setVerificationStatus] = useState('loading'); // 'loading', 'success', 'error'

    // refs to prevent verifying the same payment twice on re-render
    // (payment gateways redirect back to this page with ?pidx= in the URL)
    const isAutoVerifyingRef = useRef(false);
    const hasProcessedCallbackRef = useRef(false);

    const fetchPayments = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const data = await paymentService.getAllPayments();
            setPayments(data || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    // handles redirect back from Khalti or eSewa after payment
    const handlePaymentCallback = useCallback(async () => {
        // skip if already done
        if (hasProcessedCallbackRef.current) return;

        const urlParams = new URLSearchParams(window.location.search);
        const pidx = urlParams.get('pidx');                   // Khalti param
        const purchaseOrderId = urlParams.get('purchase_order_id'); // Khalti param
        const encodedData = urlParams.get('data');            // eSewa param (base64)

        if (!pidx && !encodedData) return;

        hasProcessedCallbackRef.current = true;
        // remove tokens from URL so refresh doesn't re-trigger verification
        window.history.replaceState({}, document.title, window.location.pathname);

        // --- Khalti ---
        if (pidx) {
            try {
                setVerificationMessage("Verifying your Khalti payment...");

                // our internal DB ID is embedded in the order ID e.g. "StaySpot-42-..."
                let paymentId = purchaseOrderId?.split('-')[1];

                // fallback: fetch payments from backend if order ID is missing and state is empty
                if (!paymentId) {
                    let currentPayments = payments;
                    if (currentPayments.length === 0) {
                        currentPayments = await paymentService.getAllPayments();
                    }
                    const pendingKhalti = currentPayments.find(p => p.status === 'Pending' || p.status === 'Overdue');
                    if (pendingKhalti) paymentId = pendingKhalti.id;
                }

                if (paymentId) {
                    const verifyResult = await paymentService.verifyKhaltiPayment(paymentId, pidx);
                    if (verifyResult.status === 'Payment verified successfully') {
                        setVerificationStatus('success');
                        setVerificationMessage("Payment Verified Successfully!");
                    } else {
                        setVerificationStatus('error');
                        setVerificationMessage(`Status: ${verifyResult.status || 'Done'}`);
                    }
                    await fetchPayments(false); // silent refresh
                } else {
                    setVerificationStatus('error');
                    setVerificationMessage("Khalti returned successfully, but we could not find which pending payment this belongs to!");
                }
            } catch (err) {
                console.error('Khalti callback error:', err);
                setVerificationStatus('error');
                setVerificationMessage(`Khalti verification failed: ${err.message}`);
            } finally {
                setTimeout(() => setVerificationMessage(null), 8000);
            }
        }

        // --- eSewa ---
        if (encodedData) {
            try {
                setVerificationMessage("Verifying your eSewa payment...");

                // Fix base64 format (eSewa sometimes uses base64url or truncates padding, and URL decodes + into spaces)
                let safeData = encodedData.replace(/-/g, '+').replace(/_/g, '/').replace(/ /g, '+');
                while (safeData.length % 4 !== 0) { safeData += '='; }
                
                const decodedString = atob(safeData);
                const responseData = JSON.parse(decodedString);
                
                const transactionUuid = responseData.transaction_uuid || '';
                let paymentId = transactionUuid.split('-')[1];

                // fallback: fetch payments from backend if order ID is missing and state is empty
                if (!paymentId) {
                    let currentPayments = payments;
                    if (currentPayments.length === 0) {
                        currentPayments = await paymentService.getAllPayments();
                    }
                    const pendingEsewa = currentPayments.find(p => p.status === 'Pending' || p.status === 'Overdue');
                    if (pendingEsewa) paymentId = pendingEsewa.id;
                }

                const status = responseData.status?.toUpperCase();

                if (paymentId) {
                    if (status === 'COMPLETE' || status === 'SUCCESS') {
                        const verifyResult = await paymentService.verifyEsewaPayment(paymentId, safeData);
                        if (verifyResult.status === 'Payment verified successfully' || verifyResult.status === 'Paid') {
                            setVerificationStatus('success');
                            setVerificationMessage("eSewa Payment Verified Successfully!");
                        } else if (verifyResult.error) {
                            setVerificationStatus('error');
                            setVerificationMessage(`eSewa Verification failed: ${verifyResult.error}`);
                        } else {
                            setVerificationStatus('success');
                            setVerificationMessage("eSewa payment recorded succesfully.");
                        }
                    } else {
                        setVerificationStatus('error');
                        setVerificationMessage(`eSewa payment failed. Status: ${responseData.status || 'Unknown'}`);
                    }
                } else {
                    setVerificationStatus('error');
                    setVerificationMessage("eSewa ID mismatch error. Please contact support.");
                }
                
                await fetchPayments(false);
            } catch (err) {
                console.error('eSewa callback error:', err);
                setVerificationStatus('error');
                setVerificationMessage("eSewa verification failed. Please contact support.");
            } finally {
                setTimeout(() => setVerificationMessage(null), 8000);
            }
        }
    }, [payments.length, location.search]);

    useEffect(() => {
        handlePaymentCallback();
    }, [location.search, handlePaymentCallback]);

    // auto-verify pending payments that already have a transaction_id
    // handles the case where user closed the browser mid-redirect but payment went through
    useEffect(() => {
        const autoVerify = async () => {
            if (payments.length > 0 && !isAutoVerifyingRef.current) {
                const pending = payments.filter(
                    p => (p.status === 'Pending' || p.status === 'Overdue') && p.transaction_id
                );

                if (pending.length > 0) {
                    isAutoVerifyingRef.current = true;
                    let changed = false;
                    for (const p of pending) {
                        try {
                            let res;
                            if (p.payment_method === 'Khalti') {
                                res = await paymentService.verifyKhaltiPayment(p.id, p.transaction_id);
                            } else if (p.payment_method === 'eSewa') {
                                res = await paymentService.checkEsewaStatus(p.id, p.transaction_id);
                            }
                            if (res?.status === 'Payment verified successfully') changed = true;
                        } catch (e) {
                            console.error('Auto-verify failed for', p.id, e);
                        }
                    }
                    isAutoVerifyingRef.current = false;
                    if (changed) fetchPayments(false);
                }
            }
        };
        autoVerify();
    }, [payments.length]);

    // eSewa requires an HTML form POST — fetch() won't work with their API
    const handleEsewaPayment = async (payment) => {
        try {
            const params = await paymentService.getEsewaParams(payment.id);
            const esewaUrl = params.esewa_url;
            
            // Force the redirect to the current domain + path to prevent environment mismatches
            const successUrl = `${window.location.origin}/tenant/payments`;
            const failureUrl = `${window.location.origin}/tenant/payments`;

            const formFields = {
                amount: params.amount,
                tax_amount: params.tax_amount,
                total_amount: params.total_amount,
                transaction_uuid: params.transaction_uuid,
                product_code: params.product_code,
                product_service_charge: params.product_service_charge,
                product_delivery_charge: params.product_delivery_charge,
                success_url: successUrl,
                failure_url: failureUrl,
                signed_field_names: params.signed_field_names,
                signature: params.signature
            };

            // build and submit an invisible form so browser does native POST
            const form = document.createElement('form');
            form.setAttribute('method', 'POST');
            form.setAttribute('action', esewaUrl);

            for (const key in formFields) {
                const hiddenField = document.createElement('input');
                hiddenField.setAttribute('type', 'hidden');
                hiddenField.setAttribute('name', key);
                hiddenField.setAttribute('value', formFields[key]);
                form.appendChild(hiddenField);
            }

            document.body.appendChild(form);
            form.submit();
        } catch (error) {
            console.error('Error initiating eSewa payment:', error);
            setVerificationStatus('error');
            setVerificationMessage('Failed to initiate payment. Please try again.');
        }
    };

    // Khalti just needs a URL redirect, much simpler than eSewa
    const handleKhaltiPayment = async (payment) => {
        try {
            const returnUrl = `${window.location.origin}/tenant/payments`;
            const response = await paymentService.initiateKhaltiPayment(payment.id, returnUrl);
            if (response.payment_url) {
                window.location.href = response.payment_url;
            } else {
                throw new Error("Payment URL not received");
            }
        } catch (error) {
            console.error('Error initiating Khalti payment:', error);
            setVerificationStatus('error');
            setVerificationMessage('Failed to initiate Khalti payment. Please try again.');
        }
    };

    // filter payments based on search + status dropdown
    const filteredPayments = (payments || []).filter(payment => {
        const matchesSearch =
            payment.booking?.room?.owner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.payment_type?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All Status' || payment.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // summary card totals
    const totalPaid = (payments || [])
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const upcomingRent = (payments || [])
        .filter(p => p.status === 'Pending' || p.status === 'Overdue')
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0]?.amount || 0;

    const pendingAmount = (payments || [])
        .filter(p => p.status === 'Pending' || p.status === 'Overdue')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const pendingCount = (payments || []).filter(p => p.status === 'Pending' || p.status === 'Overdue').length;

    return (
        <div className="flex bg-gray-50">
            <TenantSidebar user={user} />

            <div className="flex-1 flex flex-col">
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="p-8 pb-0">
                        <div className="max-w-6xl mx-auto">
                            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
                            <p className="text-gray-500">Manage your rent and viewing fees</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-8">

                        {/* verification banner — only shown during/after gateway redirect */}
                        {verificationMessage && (
                            <div className={`max-w-6xl mx-auto mb-6 p-5 rounded-2xl shadow-xl flex items-center justify-between border-l-4 transition-all duration-500 animate-in slide-in-from-top-4 ${
                                verificationStatus === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-emerald-100' :
                                verificationStatus === 'error' ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-rose-100' :
                                'bg-blue-50 border-blue-500 text-blue-900 shadow-blue-100'
                            }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        verificationStatus === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                        verificationStatus === 'error' ? 'bg-rose-100 text-rose-600' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                        {verificationStatus === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
                                         verificationStatus === 'error' ? <AlertCircle className="w-6 h-6" /> :
                                         <Clock className="w-6 h-6 animate-spin" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm uppercase tracking-wider opacity-60">
                                            {verificationStatus === 'loading' ? 'Verifying...' : 
                                             verificationStatus === 'success' ? 'Payment Success' : 'Payment Issue'}
                                        </h4>
                                        <span className="text-base font-medium">{verificationMessage}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setVerificationMessage(null)} 
                                    className={`p-2 rounded-xl transition-colors ${
                                        verificationStatus === 'success' ? 'hover:bg-emerald-100 text-emerald-400' :
                                        verificationStatus === 'error' ? 'hover:bg-rose-100 text-rose-400' :
                                        'hover:bg-blue-100 text-blue-400'
                                    }`}
                                >
                                    <Search className="w-5 h-5 rotate-45" /> {/* Use as close icon */}
                                </button>
                            </div>
                        )}

                        <div className="max-w-6xl mx-auto flex gap-8">

                            {/* payment list */}
                            <div className="flex-1 space-y-6">

                                {/* search + filter bar */}
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search payments..."
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="relative">
                                            <select
                                                className="appearance-none bg-slate-50 border-none rounded-lg pl-4 pr-10 py-2 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition"
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                            >
                                                <option>All Status</option>
                                                <option>Paid</option>
                                                <option>Pending</option>
                                                <option>Overdue</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>

                                        <div className="relative">
                                            <select
                                                className="appearance-none bg-slate-50 border-none rounded-lg pl-4 pr-10 py-2 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition"
                                                value={timeFilter}
                                                onChange={(e) => setTimeFilter(e.target.value)}
                                            >
                                                <option>All Time</option>
                                                <option>Last 3 Months</option>
                                                <option>Last 6 Months</option>
                                                <option>This Year</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* payment cards */}
                                <div className="space-y-4">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                                            <p className="text-slate-500 font-medium">Loading payments...</p>
                                        </div>
                                    ) : filteredPayments.length > 0 ? (
                                        filteredPayments.map(payment => (
                                            <div
                                                key={payment.id}
                                                className={`bg-white rounded-xl border p-6 transition-all hover:shadow-md ${payment.status === 'Pending' || payment.status === 'Overdue'
                                                    ? 'border-yellow-200 bg-yellow-50/10'
                                                    : 'border-slate-100'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-5">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${payment.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                            {payment.status === 'Paid' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-slate-900">
                                                                {new Date(payment.due_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                            </h3>
                                                            <p className="text-sm text-slate-500 mt-0.5">
                                                                {payment.status === 'Paid' ? 'Payment Date: ' : 'Due Date: '}
                                                                {new Date(payment.status === 'Paid' ? payment.paid_date : payment.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-bold text-slate-900">NPR {parseFloat(payment.amount).toLocaleString()}</p>
                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-2 ${payment.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {payment.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                                                    <div className="flex gap-16">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Landlord</p>
                                                            <p className="text-sm font-bold text-slate-700 mt-1">{payment.booking?.room?.owner?.full_name || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                {payment.status === 'Paid' ? (
                                                                    <>
                                                                        {/* eSewa = green, Khalti = purple */}
                                                                        <div className={`w-5 h-5 rounded flex items-center justify-center ${payment.payment_method === 'eSewa' ? 'bg-green-500 text-white' : 'bg-purple-600 text-white'}`}>
                                                                            <CreditCard className="w-3 h-3" />
                                                                        </div>
                                                                        <p className="text-sm font-medium text-slate-700">{payment.payment_method}</p>
                                                                    </>
                                                                ) : (
                                                                    <p className="text-sm font-medium text-slate-500 italic">Not paid yet</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* pay buttons only shown if payment is still owed */}
                                                    {(payment.status === 'Pending' || payment.status === 'Overdue') && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleEsewaPayment(payment)}
                                                                className="px-4 py-2 bg-[#60BB46] hover:bg-[#52a13b] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                                                            >
                                                                Pay with eSewa
                                                            </button>
                                                            <button
                                                                onClick={() => handleKhaltiPayment(payment)}
                                                                className="px-4 py-2 bg-[#5D2E8E] hover:bg-[#4d2676] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                                                            >
                                                                Pay with Khalti
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Wallet className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900">No payments found</h3>
                                            <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                                                There are no payment records matching your current filters.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* right sidebar — summary cards */}
                            <div className="w-80 space-y-6">
                                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                    <h2 className="text-lg font-bold text-slate-800 mb-6">Payment Summary</h2>

                                    <div className="space-y-4">
                                        <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                                <p className="text-xs font-bold text-blue-100">Total Paid</p>
                                            </div>
                                            <div className="mt-4">
                                                <h3 className="text-2xl font-bold">NPR {totalPaid.toLocaleString()}</h3>
                                                <p className="text-[10px] text-blue-100 mt-1 opacity-80 uppercase font-bold tracking-wider">All time history</p>
                                            </div>
                                        </div>

                                        <div className="bg-amber-400 rounded-2xl p-5 text-white shadow-lg shadow-amber-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                                    <Calendar className="w-6 h-6" />
                                                </div>
                                                <p className="text-xs font-bold text-amber-50">Upcoming Rent</p>
                                            </div>
                                            <div className="mt-4">
                                                <h3 className="text-2xl font-bold">NPR {parseFloat(upcomingRent).toLocaleString()}</h3>
                                                <p className="text-[10px] text-amber-50 mt-1 opacity-80 uppercase font-bold tracking-wider">Next month payment</p>
                                            </div>
                                        </div>

                                        <div className="bg-rose-500 rounded-2xl p-5 text-white shadow-lg shadow-rose-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                                    <AlertCircle className="w-6 h-6" />
                                                </div>
                                                <p className="text-xs font-bold text-rose-50">Pending Amount</p>
                                            </div>
                                            <div className="mt-4">
                                                <h3 className="text-2xl font-bold">NPR {pendingAmount.toLocaleString()}</h3>
                                                <p className="text-[10px] text-rose-50 mt-1 opacity-80 uppercase font-bold tracking-wider">{pendingCount} payment pending</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* quick pay — picks the first pending payment automatically */}
                                    <div className="mt-8 pt-8 border-t border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Pay With</h4>
                                        <div className="space-y-3">
                                            <div
                                                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                                                onClick={() => {
                                                    const nextPending = payments.find(p => p.status === 'Pending' || p.status === 'Overdue');
                                                    if (nextPending) handleEsewaPayment(nextPending);
                                                    else alert('No pending payments to pay with eSewa.');
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[#60BB46]/10 rounded-lg flex items-center justify-center">
                                                        <div className="w-6 h-6 bg-[#60BB46] rounded flex items-center justify-center text-white text-[13px] font-extrabold">e</div>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700">eSewa</span>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-slate-300" />
                                            </div>

                                            <div
                                                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                                                onClick={() => {
                                                    const nextPending = payments.find(p => p.status === 'Pending' || p.status === 'Overdue');
                                                    if (nextPending) handleKhaltiPayment(nextPending);
                                                    else alert('No pending payments to pay with Khalti.');
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[#5D2E8E]/10 rounded-lg flex items-center justify-center">
                                                        <div className="w-6 h-6 bg-[#5D2E8E] rounded flex items-center justify-center text-white text-[13px] font-extrabold">K</div>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700">Khalti</span>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-slate-300" />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                                        onClick={() => {
                                            const nextPending = payments.find(p => p.status === 'Pending' || p.status === 'Overdue');
                                            if (nextPending) handleEsewaPayment(nextPending);
                                            else alert('No pending payments found.');
                                        }}
                                    >
                                        <DollarSign className="w-5 h-5" />
                                        Make Payment
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}