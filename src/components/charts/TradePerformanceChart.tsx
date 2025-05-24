import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { TradeEntry } from '../../models/TradeEntry';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TradePerformanceChartProps {
  trades: TradeEntry[];
  initialBalance: number;
  isMobile?: boolean;
}

const TradePerformanceChart: React.FC<TradePerformanceChartProps> = ({ 
  trades, 
  initialBalance, 
  isMobile = false 
}) => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (!trades || trades.length === 0) return;

    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => {
      const dateA = new Date(a.entryDate || a.tradeDate || '');
      const dateB = new Date(b.entryDate || b.tradeDate || '');
      return dateA.getTime() - dateB.getTime();
    });

    // Calculate running balance and point colors
    let runningBalance = initialBalance;
    const labels = ['Start'];
    const balanceData = [initialBalance];
    const initialBalanceData = [initialBalance];
    const pointColors = ['rgba(99, 102, 241, 1)']; // Start point color
    const pointBorderColors = ['rgba(99, 102, 241, 1)'];

    sortedTrades.forEach((trade, index) => {
      const tradeProfitLoss = trade.profitLoss || 0;
      runningBalance += tradeProfitLoss;
      
      if (isMobile) {
        labels.push(''); // No labels on mobile
      } else {
        const date = new Date(trade.entryDate || trade.tradeDate || '');
        labels.push(date.toLocaleDateString());
      }
      
      balanceData.push(runningBalance);
      initialBalanceData.push(initialBalance);
      
      // Color points based on win/loss
      if (tradeProfitLoss > 0) {
        pointColors.push('rgba(34, 197, 94, 1)'); // Green for wins
        pointBorderColors.push('rgba(34, 197, 94, 1)');
      } else if (tradeProfitLoss < 0) {
        pointColors.push('rgba(239, 68, 68, 1)'); // Red for losses
        pointBorderColors.push('rgba(239, 68, 68, 1)');
      } else {
        pointColors.push('rgba(156, 163, 175, 1)'); // Gray for break-even
        pointBorderColors.push('rgba(156, 163, 175, 1)');
      }
    });

    setChartData({
      labels,
      datasets: [
        {
          label: 'Account Balance',
          data: balanceData,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: isMobile ? 3 : 2,
          tension: 0.4,
          pointRadius: isMobile ? 0 : 6, // No points on mobile for cleaner look
          pointHoverRadius: isMobile ? 0 : 8,
          pointBackgroundColor: pointColors,
          pointBorderColor: pointBorderColors,
          pointBorderWidth: 2,
        },
        {
          label: 'Initial Balance',
          data: initialBalanceData,
          borderColor: 'rgba(156, 163, 175, 0.8)',
          backgroundColor: 'transparent',
          borderWidth: isMobile ? 2 : 2,
          borderDash: [5, 5],
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    });
  }, [trades, initialBalance, isMobile]);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading chart...</p>
      </div>
    );
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: !isMobile, // Hide legend on mobile
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: !isMobile, // Disable tooltips on mobile for cleaner experience
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) { // Account Balance line
              const value = context.parsed.y;
              const pointIndex = context.dataIndex;
              
              if (pointIndex === 0) {
                return `Initial Balance: $${value.toFixed(2)}`;
              }
              
              // Calculate trade result
              const prevValue = context.dataset.data[pointIndex - 1] as number;
              const tradeResult = value - prevValue;
              const resultText = tradeResult > 0 ? `+$${tradeResult.toFixed(2)}` : 
                                tradeResult < 0 ? `-$${Math.abs(tradeResult).toFixed(2)}` : 
                                '$0.00';
              
              return [
                `Balance: $${value.toFixed(2)}`,
                `Trade Result: ${resultText}`
              ];
            }
            return `Initial Balance: $${context.parsed.y.toFixed(2)}`;
          }
        }
      },
    },
    scales: {
      x: {
        display: !isMobile, // Completely hide X axis on mobile
        grid: {
          display: false, // No grid on both web and mobile
        },
        ticks: {
          display: !isMobile, // No ticks on mobile
        },
        border: {
          display: !isMobile, // No border on mobile
        },
      },
      y: {
        display: !isMobile, // Completely hide Y axis on mobile
        grid: {
          display: false, // No grid on both web and mobile
        },
        ticks: {
          display: !isMobile, // No ticks on mobile
          callback: function(value) {
            return '$' + value;
          },
        },
        border: {
          display: !isMobile, // No border on mobile
        },
      },
    },
    elements: {
      point: {
        radius: isMobile ? 0 : 6, // No points on mobile
      },
    },
    layout: {
      padding: isMobile ? 0 : 10, // Minimal padding on web, none on mobile
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return <Line data={chartData} options={options} />;
};

export default TradePerformanceChart; 