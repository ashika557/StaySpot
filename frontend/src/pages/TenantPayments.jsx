import React, { useState, useEffect } from 'react';
import TenantSidebar from '../components/TenantSidebar';
import {
    Search,
    ChevronDown,
    CheckCircle2,
    Clock,
    Wallet,
    CreditCard,
    DollarSign,
    Calendar,
    AlertCircle,
    ExternalLink,
    Filter
} from 'lucide-react';
import { paymentService } from '../services/tenantService';
import NotificationBell from '../components/NotificationBell';

export default function TenantPayments({ user }) {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [timeFilter, setTimeFilter] = useState('All Time');

    useEffect(() => {
        fetchPayments();
        handlePaymentCallback();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const data = await paymentService.getAllPayments();
            setPayments(data);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentCallback = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const paymentId = urlParams.get('payment_id');
        const method = urlParams.get('method');
        const encodedData = urlParams.get('data');

        if (status === 'success' && paymentId && method === 'esewa' && encodedData) {
            try {
                await paymentService.verifyEsewaPayment(paymentId, encodedData);
                alert("eSewa payment verified successfully!");
                fetchPayments();
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (err) {
                console.error(err);
                alert("eSewa payment verification failed.");
            }
        } else if (status === 'failure') {
            alert("Payment failed.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    };

    const handleEsewaPayment = async (payment) => {
        try {
            // Get signed parameters from backend
            const params = await paymentService.getEsewaParams(payment.id);
            const esewaUrl = params.esewa_url;

            // These are the fields eSewa v2 expects
            const formFields = {
                amount: params.amount,
                failure_url: params.failure_url,
                product_delivery_charge: params.product_delivery_charge,
                product_service_charge: params.product_service_charge,
                product_code: params.product_code,
                signature: params.signature,
                signed_field_names: params.signed_field_names,
                success_url: params.success_url,
                tax_amount: params.tax_amount,
                total_amount: params.total_amount,
                transaction_uuid: params.transaction_uuid
            };

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
            alert('Failed to initiate payment. Please try again.');
        }
    };

    const handleKhaltiPayment = (payment) => {
        const config = {
            publicKey: "test_public_key_dc74e544b251410f90ad459956f3475d",
            productIdentity: `PAY-${payment.id}`,
            productName: payment.payment_type,
            productUrl: window.location.href,
            eventHandler: {
                onSuccess(payload) {
                    // Convert amount to paisa
                    const amountInPaisa = Math.round(parseFloat(payment.amount) * 100);
                    paymentService.verifyKhaltiPayment(payment.id, payload.token, amountInPaisa)
                        .then(() => {
                            alert("Payment successful!");
                            fetchPayments();
                        })
                        .catch((err) => {
                            console.error(err);
                            alert("Payment verification failed.");
                        });
                },
                onError(error) {
                    console.log(error);
                    alert("Payment failed.");
                },
                onClose() {
                    console.log('widget is closing');
                }
            },
            paymentPreference: ["KHALTI", "EBANKING", "MOBILE_BANKING", "CONNECT_IPS", "SCT"],
        };

        if (window.KhaltiCheckout) {
            const checkout = new window.KhaltiCheckout(config);
            checkout.show({ amount: parseFloat(payment.amount) * 100 });
        } else {
            const script = document.createElement('script');
            script.src = "https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2020.12.17.0.0.0/khalti-checkout.iffe.js";
            script.onload = () => {
                const checkout = new window.KhaltiCheckout(config);
                checkout.show({ amount: parseFloat(payment.amount) * 100 });
            };
            document.body.appendChild(script);
        }
    };

    // Filter payments
    const filteredPayments = payments.filter(payment => {
        const matchesSearch =
            payment.booking?.room?.owner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.payment_type?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'All Status' || payment.status === statusFilter;

        // Simple time filter logic (for demo/real use case this could be more complex)
        const matchesTime = true; // Placeholder for now

        return matchesSearch && matchesStatus && matchesTime;
    });

    // Calculate summary stats
    const totalPaid = payments
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const upcomingRent = payments
        .filter(p => p.status === 'Pending' || p.status === 'Overdue')
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0]?.amount || 0;

    const pendingAmount = payments
        .filter(p => p.status === 'Pending' || p.status === 'Overdue')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const pendingCount = payments.filter(p => p.status === 'Pending' || p.status === 'Overdue').length;

    return (
        <div className="flex h-screen bg-[#F8FAFC]">
            <TenantSidebar user={user} />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b px-8 py-4 flex items-center justify-between sticky top-0 z-20">
                    <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
                    <div className="flex items-center gap-4">
                        <NotificationBell user={user} isDark={true} />
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-900 leading-none">{user?.full_name}</p>
                                <p className="text-xs text-slate-500 mt-1">{user?.role}</p>
                            </div>
                            <img
                                src={`https://ui-avatars.com/api/?name=${user?.full_name}&background=random`}
                                className="w-10 h-10 rounded-full border-2 border-slate-100"
                                alt="Profile"
                            />
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-6xl mx-auto flex gap-8">

                        {/* Main Column */}
                        <div className="flex-1 space-y-6">
                            {/* Filters */}
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

                            {/* Payment List */}
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
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${payment.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                                                        }`}>
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
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-2 ${payment.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
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
                                                                    <div className={`w-5 h-5 rounded flex items-center justify-center ${payment.payment_method === 'eSewa' ? 'bg-green-500 text-white' : 'bg-purple-600 text-white'
                                                                        }`}>
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

                        {/* Sidebar Column */}
                        <div className="w-80 space-y-6">
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-800 mb-6">Payment Summary</h2>

                                <div className="space-y-4">
                                    {/* Total Paid */}
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

                                    {/* Upcoming Rent */}
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

                                    {/* Pending Amount */}
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
                                                    <div className="w-6 h-6 bg-[#60BB46] rounded flex items-center justify-center text-white text-[10px] font-bold">e</div>
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
                                                    <div className="w-6 h-6 bg-[#5D2E8E] rounded flex items-center justify-center text-white text-[10px] font-bold">K</div>
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
    );
}
