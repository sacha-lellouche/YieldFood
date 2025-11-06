import React, { useEffect, useState } from 'react';
import { fetchSalesData } from '../lib/api';

const DashboardTable = () => {
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSalesData = async () => {
            const data = await fetchSalesData();
            setSalesData(data);
            setLoading(false);
        };

        getSalesData();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {salesData.map((sale) => (
                        <tr key={sale.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.item}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.totalRevenue}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DashboardTable;