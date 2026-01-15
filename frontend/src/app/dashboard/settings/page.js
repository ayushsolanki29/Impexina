"use client";

import React, { useState, useEffect } from 'react';
import API from '@/lib/api';
import { toast } from 'sonner';
import { 
    Loader2, Save, Settings, Layers, Lock, Key, 
    ShieldCheck, AlertCircle, CheckCircle2, Eye, EyeOff,
    RefreshCw
} from 'lucide-react';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Bifurcation Settings
    const [mixLimit, setMixLimit] = useState(5);
    const [mixLimitTemp, setMixLimitTemp] = useState(5);
    
    // Accounts Settings
    const [keyphrase, setKeyphrase] = useState('');
    const [keyphraseConfirm, setKeyphraseConfirm] = useState('');
    const [showKeyphrase, setShowKeyphrase] = useState(false);
    const [showKeyphraseConfirm, setShowKeyphraseConfirm] = useState(false);
    const [accountsConfigured, setAccountsConfigured] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
    const [accountsLoading, setAccountsLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
        checkAccountsConfig();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await API.get('/settings/bifurcation/get');
            if (response.data.success) {
                setMixLimit(response.data.data.mixLimit);
                setMixLimitTemp(response.data.data.mixLimit);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const checkAccountsConfig = async () => {
        try {
            const response = await API.get('/settings/accounts/get');
            if (response.data.success) {
                setAccountsConfigured(response.data.data.isConfigured);
            }
        } catch (error) {
            console.error("Failed to check accounts config");
        }
    };

    const handleSaveBifurcation = async () => {
        try {
            setSaving(true);
            const response = await API.post('/settings/bifurcation/update', {
                mixLimit: parseInt(mixLimitTemp)
            });
            if (response.data.success) {
                setMixLimit(mixLimitTemp);
                toast.success("Bifurcation settings saved");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to save bifurcation settings");
        } finally {
            setSaving(false);
        }
    };

    const handleSetKeyphrase = async (e) => {
        e.preventDefault();
        
        if (!keyphrase || keyphrase.length < 4) {
            toast.error("Keyphrase must be at least 4 characters");
            return;
        }

        if (keyphrase !== keyphraseConfirm) {
            toast.error("Keyphrases do not match");
            return;
        }

        try {
            setAccountsLoading(true);
            const response = await API.post('/settings/accounts/keyphrase', {
                keyphrase
            });
            if (response.data.success) {
                setGeneratedPassword(response.data.data.password);
                setAccountsConfigured(true);
                setKeyphrase('');
                setKeyphraseConfirm('');
                toast.success("Keyphrase set successfully! Please save the generated password securely.");
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to set keyphrase");
        } finally {
            setAccountsLoading(false);
        }
    };

    const handleResetKeyphrase = () => {
        setKeyphrase('');
        setKeyphraseConfirm('');
        setGeneratedPassword('');
        setShowGeneratedPassword(false);
    };

    if (loading) {
        return (
            <div className="p-8 bg-slate-50 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="text-sm text-slate-400 font-semibold">Loading settings...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 2xl:p-8 bg-slate-50 min-h-screen font-sans antialiased text-slate-900">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3 mb-2">
                        <Settings className="w-6 h-6 text-blue-600" />
                        System Settings
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Configure system-wide settings and security options.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Bifurcation Settings */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-5 bg-slate-50/80 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <Layers className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Bifurcation Settings</h2>
                                    <p className="text-xs text-slate-500 font-medium">Configure bifurcation report preferences</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                    Product Layout Limit
                                </label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="number"
                                        min="1"
                                        className="w-32 px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-bold text-slate-700 text-sm"
                                        value={mixLimitTemp}
                                        onChange={(e) => setMixLimitTemp(e.target.value)}
                                    />
                                    <span className="text-sm text-slate-600 font-medium">
                                        {mixLimitTemp === mixLimit ? (
                                            <span className="text-slate-400">Current value</span>
                                        ) : (
                                            <span className="text-amber-600 flex items-center gap-1">
                                                <AlertCircle className="w-4 h-4" />
                                                Unsaved changes
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-3 font-medium leading-relaxed">
                                    Descriptions collapse to "MIX ITEM" for marks exceeding this limit. Current: <span className="font-bold text-slate-600">{mixLimit}</span>
                                </p>
                            </div>

                            <button 
                                onClick={handleSaveBifurcation}
                                disabled={saving || mixLimitTemp === mixLimit}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Accounts Security Settings */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-5 bg-slate-50/80 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                    <Lock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-slate-900">Accounts Security</h2>
                                        {accountsConfigured ? (
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Configured
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-100 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                Not Set
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">Set up keyphrase-based access for accounts module</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {accountsConfigured && generatedPassword ? (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                                    <div className="flex items-start gap-3 mb-4">
                                        <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="text-sm font-bold text-emerald-900 mb-1">Keyphrase Set Successfully</h3>
                                            <p className="text-xs text-emerald-700 font-medium mb-4">
                                                Use the generated password below to access the accounts module. Save it securely!
                                            </p>
                                            
                                            <div className="bg-white rounded-lg p-4 border border-emerald-200">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                                    Generated Password
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-lg font-mono font-bold text-slate-900 tracking-wider">
                                                        {showGeneratedPassword ? generatedPassword : '••••••••'}
                                                    </code>
                                                    <button
                                                        onClick={() => setShowGeneratedPassword(!showGeneratedPassword)}
                                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                    >
                                                        {showGeneratedPassword ? (
                                                            <EyeOff className="w-4 h-4 text-slate-600" />
                                                        ) : (
                                                            <Eye className="w-4 h-4 text-slate-600" />
                                                        )}
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-3 font-medium">
                                                    This password is derived from your keyphrase. Users can enter either the keyphrase or this password to access accounts.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={handleResetKeyphrase}
                                        className="w-full py-2.5 text-sm font-semibold text-amber-700 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors"
                                    >
                                        Set New Keyphrase
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                            <div>
                                                <h3 className="text-sm font-bold text-amber-900 mb-1">Security Information</h3>
                                                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                                    Setting a keyphrase will generate a secure password for accounts access. 
                                                    Users can access accounts using either the keyphrase or the generated password.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSetKeyphrase} className="space-y-4">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                                Keyphrase
                                            </label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input 
                                                    type={showKeyphrase ? "text" : "password"}
                                                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-slate-700 text-sm"
                                                    placeholder="Enter a secure keyphrase (min. 4 characters)"
                                                    value={keyphrase}
                                                    onChange={(e) => setKeyphrase(e.target.value)}
                                                    minLength={4}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowKeyphrase(!showKeyphrase)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded transition-colors"
                                                >
                                                    {showKeyphrase ? (
                                                        <EyeOff className="w-4 h-4 text-slate-600" />
                                                    ) : (
                                                        <Eye className="w-4 h-4 text-slate-600" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                                Confirm Keyphrase
                                            </label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input 
                                                    type={showKeyphraseConfirm ? "text" : "password"}
                                                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-slate-700 text-sm"
                                                    placeholder="Re-enter the keyphrase"
                                                    value={keyphraseConfirm}
                                                    onChange={(e) => setKeyphraseConfirm(e.target.value)}
                                                    minLength={4}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowKeyphraseConfirm(!showKeyphraseConfirm)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded transition-colors"
                                                >
                                                    {showKeyphraseConfirm ? (
                                                        <EyeOff className="w-4 h-4 text-slate-600" />
                                                    ) : (
                                                        <Eye className="w-4 h-4 text-slate-600" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <button 
                                            type="submit"
                                            disabled={accountsLoading || !keyphrase || keyphrase !== keyphraseConfirm || keyphrase.length < 4}
                                            className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-md shadow-amber-50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {accountsLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Setting Keyphrase...
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="w-4 h-4" />
                                                    Set Keyphrase
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
