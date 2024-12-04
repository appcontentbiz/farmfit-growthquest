import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const MarketScreen = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCommodity, setSelectedCommodity] = useState('corn');
  const [refreshing, setRefreshing] = useState(false);

  const fetchMarketData = async () => {
    try {
      // In a real app, this would fetch from an actual API
      const mockData = {
        corn: {
          current_price: 5.75,
          currency: 'USD',
          unit: 'bushel',
          trend: 'up',
          history: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            prices: [5.2, 5.4, 5.3, 5.6, 5.7, 5.75],
          },
        },
        wheat: {
          current_price: 7.25,
          currency: 'USD',
          unit: 'bushel',
          trend: 'down',
          history: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            prices: [7.5, 7.4, 7.3, 7.2, 7.3, 7.25],
          },
        },
        soybeans: {
          current_price: 13.50,
          currency: 'USD',
          unit: 'bushel',
          trend: 'stable',
          history: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            prices: [13.2, 13.4, 13.5, 13.4, 13.5, 13.5],
          },
        },
      };

      setMarketData(mockData);
      setError(null);
    } catch (err) {
      setError('Error fetching market data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchMarketData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const renderPriceChart = () => {
    const data = marketData[selectedCommodity];
    return (
      <LineChart
        data={{
          labels: data.history.labels,
          datasets: [
            {
              data: data.history.prices,
            },
          ],
        }}
        width={screenWidth - 40}
        height={220}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.commodityButtons}>
        {Object.keys(marketData).map((commodity) => (
          <TouchableOpacity
            key={commodity}
            style={[
              styles.commodityButton,
              selectedCommodity === commodity && styles.selectedCommodity,
            ]}
            onPress={() => setSelectedCommodity(commodity)}
          >
            <Text
              style={[
                styles.commodityButtonText,
                selectedCommodity === commodity && styles.selectedCommodityText,
              ]}
            >
              {commodity.charAt(0).toUpperCase() + commodity.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.currentPrice}>
          ${marketData[selectedCommodity].current_price.toFixed(2)}
        </Text>
        <Text style={styles.priceUnit}>
          per {marketData[selectedCommodity].unit}
        </Text>
        <View
          style={[
            styles.trendIndicator,
            {
              backgroundColor:
                marketData[selectedCommodity].trend === 'up'
                  ? '#4CAF50'
                  : marketData[selectedCommodity].trend === 'down'
                  ? '#f44336'
                  : '#ff9800',
            },
          ]}
        >
          <Text style={styles.trendText}>
            {marketData[selectedCommodity].trend.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>6 Month Price Trend</Text>
        {renderPriceChart()}
      </View>

      <View style={styles.marketInsights}>
        <Text style={styles.insightsTitle}>Market Insights</Text>
        <Text style={styles.insightsText}>
          Current market conditions suggest stable prices for {selectedCommodity} in
          the coming weeks. Consider reviewing your storage capacity and sales
          strategy.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commodityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#fff',
    elevation: 2,
  },
  commodityButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    minWidth: 100,
    alignItems: 'center',
  },
  selectedCommodity: {
    backgroundColor: '#4CAF50',
  },
  commodityButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedCommodityText: {
    color: '#fff',
  },
  priceContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 15,
    marginHorizontal: 15,
    borderRadius: 10,
    elevation: 2,
  },
  currentPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  priceUnit: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  trendIndicator: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 10,
  },
  trendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  marketInsights: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  insightsText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 16,
  },
});

export default MarketScreen;
