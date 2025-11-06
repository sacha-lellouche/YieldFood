import React, { useEffect, useState } from 'react';
import { fetchSalesData, fetchForecastData } from '../../lib/api';
import DashboardTable from '../../components/DashboardTable';

const DashboardPage = () => {
  const [salesData, setSalesData] = useState([]);
  const [forecastData, setForecastData] = useState([]);

  useEffect(() => {
    const getData = async () => {
      const sales = await fetchSalesData();
      const forecast = await fetchForecastData();
      setSalesData(sales);
      setForecastData(forecast);
    };

    getData();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <DashboardTable salesData={salesData} forecastData={forecastData} />
    </div>
  );
};

export default DashboardPage;