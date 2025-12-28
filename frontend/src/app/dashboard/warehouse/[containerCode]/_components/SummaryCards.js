import React from 'react';
import { Package, Box, Scale, Truck, FileText, Calendar, CheckCircle } from 'lucide-react';

export default function SummaryCards({ totals, containerDetails }) {
  const cards = [
    {
      title: "Total CTN",
      value: totals.totalCTN,
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Total CBM",
      value: totals.totalCBM.toFixed(3),
      icon: Box,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Total Weight",
      value: `${totals.totalWeight} kg`,
      icon: Scale,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "With Delivery",
      value: `${totals.itemsWithDelivery}/${totals.totalMarks}`,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "With Invoice",
      value: `${totals.itemsWithInvoice}/${totals.totalMarks}`,
      icon: FileText,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    {
      title: "With Transporter",
      value: `${totals.itemsWithTransporter}/${totals.totalMarks}`,
      icon: Truck,
      color: "text-pink-600",
      bgColor: "bg-pink-50"
    },
    {
      title: "Completed",
      value: `${totals.completedItems}/${totals.totalMarks}`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.slice(0, 4).map((card, index) => (
        <div key={index} className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${card.bgColor} rounded-lg`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className="text-2xl font-semibold">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}