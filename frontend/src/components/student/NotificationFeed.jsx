import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Calendar, BookOpen, Clock, CheckCircle, Info } from 'lucide-react';
import api from '../../services/api';

const NotificationFeed = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/notifications');
                if (res.data.success && res.data.data.notifications) {
                    setNotifications(res.data.data.notifications);
                }
            } catch (err) {
                console.error("Failed to fetch notifications:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const markRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            console.error("Failed to mark read:", err);
        }
    };

    if (loading) return null;
    if (notifications.length === 0) return null;

    return (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-500/20 rounded-lg text-primary-400">
                    <Bell size={20} className="animate-bounce" />
                </div>
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">System Intelligence Alerts</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notifications.map((n) => (
                    <div
                        key={n._id}
                        className={`relative group bg-slate-900 border ${n.type === 'Attendance' ? 'border-rose-500/30 bg-rose-500/5' :
                            n.type === 'Exam' ? 'border-amber-500/30 bg-amber-500/5' :
                                'border-blue-500/30 bg-blue-500/5'
                            } rounded-3xl p-6 transition-all hover:scale-[1.02] shadow-2xl`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${n.type === 'Attendance' ? 'bg-rose-500/20 text-rose-500' :
                                n.type === 'Exam' ? 'bg-amber-500/20 text-amber-500' :
                                    'bg-blue-500/20 text-blue-500'
                                }`}>
                                {n.type === 'Attendance' ? <AlertTriangle size={20} /> :
                                    n.type === 'Exam' ? <Calendar size={20} /> :
                                        n.type === 'Assignment' ? <BookOpen size={20} /> : <Info size={20} />}
                            </div>
                            <button
                                onClick={() => markRead(n._id)}
                                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                            >
                                <CheckCircle size={18} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${n.type === 'Attendance' ? 'text-rose-400' :
                                    n.type === 'Exam' ? 'text-amber-400' :
                                        'text-blue-400'
                                    }`}>{n.type} Threat</span>
                                <div className="w-1 h-1 bg-slate-700 rounded-full" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                    <Clock size={10} /> {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-slate-200 leading-relaxed italic">{n.message}</p>
                        </div>

                        {/* Visual background element */}
                        <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            {n.type === 'Attendance' ? <AlertTriangle size={80} /> :
                                n.type === 'Exam' ? <Calendar size={80} /> :
                                    <BookOpen size={80} />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotificationFeed;
