// LandingPage.jsx - Improved UI

'use client';
import { useRouter } from 'next/navigation';
// Using a slightly wider range of colors for visual interest
import { Ship, ArrowRight, Warehouse, Split, Receipt, CreditCard, Bot, Menu, X, Check, Box } from 'lucide-react'; 
import { useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Defining a modern color palette for the features section
  const featureColors = {
    Imports: { icon: Ship, color: 'bg-indigo-600', hover: 'shadow-indigo-300' },
    Warehouse: { icon: Warehouse, color: 'bg-emerald-600', hover: 'shadow-emerald-300' },
    Bifurcation: { icon: Split, color: 'bg-amber-600', hover: 'shadow-amber-300' },
    Invoicing: { icon: Receipt, color: 'bg-sky-600', hover: 'shadow-sky-300' },
    Accounts: { icon: CreditCard, color: 'bg-rose-600', hover: 'shadow-rose-300' },
    Automation: { icon: Bot, color: 'bg-violet-600', hover: 'shadow-violet-300' },
  };

  const features = [
    { title: 'Imports', desc: 'Manage shipments, containers & loading sheets in one place.' },
    { title: 'Warehouse', desc: 'Stock tracking, inward/outward & low-stock alerts.' },
    { title: 'Bifurcation', desc: 'Automated item sorting & allocation workflows.' },
    { title: 'Invoicing', desc: 'GST-ready invoices, documents, and dispatch slips.' },
    { title: 'Accounts', desc: 'Ledger, payments, credit tracking & financial logs.' },
    { title: 'Automation', desc: 'Automated WhatsApp updates & workflow triggers.' },
  ];

  const StatPill = ({ icon: Icon, value, label, color }) => (
    <div className={`p-4 bg-white rounded-xl border border-gray-100 shadow-lg transition duration-300 hover:scale-[1.02] transform`}>
      <div className="flex items-center space-x-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className={`text-xs uppercase font-medium ${color}`}>{label}</p>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900">
      
      {/* NAVIGATION - Improved shadow and border */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          
          {/* Logo - Slightly refined colors */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg">
              <Ship className="w-4 h-4" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-gray-900">SLEXIM ERP</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10 text-sm font-medium">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition">Features</a>
            <a href="#overview" className="text-gray-600 hover:text-blue-600 transition">Overview</a>
            <a href="#contact" className="text-gray-600 hover:text-blue-600 transition">Contact</a>
          </div>

          {/* Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={() => router.push('/auth/login')} 
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition"
            >
              Login
            </button>
         
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
            <div className="px-4 py-4 space-y-3 text-base">
              <a href="#features" className="block text-gray-700 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#overview" className="block text-gray-700 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Overview</a>
              <a href="#contact" className="block text-gray-700 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Contact</a>

              <div className="pt-4 space-y-3">
                <button
                  onClick={() => { router.push('/login'); setMobileMenuOpen(false); }}
                  className="w-full py-2 text-center text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 transition"
                >
                  Login
                </button>
                <button
                  onClick={() => { router.push('/register'); setMobileMenuOpen(false); }}
                  className="w-full py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                  Start Free Trial
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      {/* --- */}

      {/* HERO SECTION - Improved spacing, typography, and visual element */}
      <section className="pt-40 pb-28 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">

          {/* Text Content */}
          <div className="lg:col-span-6 space-y-6">
            <p className="text-sm font-semibold uppercase text-blue-600 tracking-widest">
                ERP for Import & Logistics
            </p>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
              Streamline Your Import <span className="text-blue-600">Workflow</span> in One ERP.
            </h1>
            
            <p className="text-gray-600 text-xl leading-relaxed max-w-lg">
              SLEXIM integrates imports, warehousing, sales, accounts, and automated updates — all in a single, secure, and modern dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => router.push('/register')}
                className="px-8 py-3 bg-blue-600 text-white rounded-full text-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-xl shadow-blue-300/60"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </button>
              <button
                className="px-8 py-3 border border-gray-300 rounded-full text-lg font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                Contact Sales
              </button>
            </div>
            
            <div className="flex items-center pt-4 text-gray-500 text-sm gap-4">
                <Check className="w-5 h-5 text-green-500" /> Secure Cloud Hosting
                <Check className="w-5 h-5 text-green-500" /> Multi-User Access
                <Check className="w-5 h-5 text-green-500" /> GST-Ready Invoicing
            </div>
          </div>

          {/* Dashboard Preview (Visual Mockup) */}
          <div className="lg:col-span-6 lg:mt-0 mt-8 relative">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl shadow-gray-200/50 w-full transform -rotate-1 perspective-1000">
                <div className="h-4 bg-gray-100 rounded-full mb-4"></div> {/* Mock Browser Bar */}
                <div className="flex space-x-4">
                    <div className="w-1/4 space-y-3">
                        <div className="h-8 bg-blue-100 rounded-lg"></div> {/* Mock Active Nav */}
                        <div className="h-8 bg-gray-100 rounded-lg"></div>
                        <div className="h-8 bg-gray-100 rounded-lg"></div>
                    </div>
                    <div className="w-3/4 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <StatPill icon={Ship} value="142" label="Active Shipments" color="text-blue-600" />
                            <StatPill icon={Box} value="4,200" label="Items in Transit" color="text-amber-600" />
                        </div>
                        <div className="h-40 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                            
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full"></div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>
      {/* --- */}

      {/* FEATURES SECTION - Improved visual consistency and hover effects */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900">End-to-End Import & Logistics Management</h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto mt-4">
            From the arrival of the container to final payment settlement, SLEXIM handles every step.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => {
            const feature = featureColors[f.title];
            const IconComponent = feature.icon;
            return (
              <div 
                key={i} 
                className={`p-8 bg-white border border-gray-100 rounded-2xl shadow-lg transition duration-300 hover:shadow-xl ${feature.hover}`}
              >
                <div className={`w-14 h-14 rounded-full ${feature.color} text-white flex items-center justify-center mb-5 shadow-lg`}>
                  <IconComponent className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-xl mb-3">{f.title}</h3>
                <p className="text-base text-gray-600">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
      {/* --- */}

      {/* CALL TO ACTION SECTION (New) */}
      <section id="overview" className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
          <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-extrabold text-white">
                  Ready to Revolutionize Your Import Process?
              </h2>
              <p className="text-blue-200 text-xl mt-4 mb-8">
                  Stop juggling spreadsheets. Get full control and clarity today.
              </p>
              <button
                  onClick={() => router.push('/register')}
                  className="px-10 py-4 bg-white text-blue-600 rounded-full text-xl font-bold hover:bg-gray-100 transition shadow-2xl shadow-blue-900/50"
              >
                  Start Your Free Trial
              </button>
          </div>
      </section>
      {/* --- */}

      {/* FOOTER - Improved layout and links */}
      <footer id="contact" className="border-t border-gray-100 py-12 text-sm bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between text-gray-600 gap-10">

          {/* Branding & Mission */}
          <div className="md:w-1/3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow">
                <Ship className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-gray-800 tracking-tight">SLEXIM ERP</span>
            </div>
            <p className="max-w-sm text-gray-500">
              The modern ERP built specifically for import, logistics, and warehouse teams to maximize efficiency.
            </p>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-3 gap-8 md:w-2/3">
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-gray-800 mb-1">Product</span>
              <a href="#features" className="hover:text-blue-600 transition">Features</a>
              <a href="#">Pricing</a>
              <a href="#">Security</a>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-semibold text-gray-800 mb-1">Company</span>
              <a href="#overview" className="hover:text-blue-600 transition">About Us</a>
              <a href="#">Careers</a>
              <a href="#contact" className="hover:text-blue-600 transition">Contact Sales</a>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-semibold text-gray-800 mb-1">Support</span>
              <a href="#">Documentation</a>
              <a href="#">FAQ</a>
              <a href="#">Help Center</a>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-400 mt-10 border-t border-gray-100 pt-6 text-xs">
          © {new Date().getFullYear()} SLEXIM ERP. All rights reserved. | <a href="#" className="hover:text-blue-600">Privacy Policy</a>
        </div>
      </footer>
      {/* --- */}
    </div>
  );
}