import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Card, Text, Button, Icon, ListItem } from 'react-native-elements';
import { LineChart } from 'react-native-charts-wrapper';

interface MarketOpportunity {
  id: string;
  product: string;
  market: string;
  price: number;
  demand: number;
  distance: number;
  requirements: string[];
}

interface PriceHistory {
  timestamp: number;
  price: number;
}

const marketOpportunities: MarketOpportunity[] = [
  {
    id: 'market-1',
    product: 'Organic Tomatoes',
    market: 'Local Farmers Market',
    price: 4.99,
    demand: 85,
    distance: 5.2,
    requirements: ['Organic Certification', 'Local Producer']
  },
  {
    id: 'market-2',
    product: 'Heritage Wheat',
    market: 'Regional Distributor',
    price: 2.99,
    demand: 95,
    distance: 25.7,
    requirements: ['Quality Certification', 'Minimum Volume']
  }
];

export const MarketAccess: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);

  const generatePriceHistory = () => {
    const history: PriceHistory[] = [];
    const basePrice = 4.0;
    for (let i = 0; i < 30; i++) {
      history.push({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: basePrice + Math.sin(i / 5) + Math.random()
      });
    }
    setPriceHistory(history);
  };

  React.useEffect(() => {
    generatePriceHistory();
  }, []);

  const renderMarketOpportunities = () => (
    <ScrollView>
      {marketOpportunities.map((opportunity) => (
        <Card key={opportunity.id} containerStyle={styles.card}>
          <View style={styles.opportunityHeader}>
            <Text style={styles.productName}>{opportunity.product}</Text>
            <Text style={styles.price}>${opportunity.price.toFixed(2)}/lb</Text>
          </View>
          <View style={styles.marketInfo}>
            <Icon name="store" type="material" size={16} color="#757575" />
            <Text style={styles.marketText}>{opportunity.market}</Text>
            <Icon name="location-on" type="material" size={16} color="#757575" />
            <Text style={styles.distanceText}>{opportunity.distance.toFixed(1)} miles</Text>
          </View>
          <View style={styles.demandContainer}>
            <Text style={styles.demandLabel}>Market Demand</Text>
            <View style={styles.demandBar}>
              <View 
                style={[
                  styles.demandFill,
                  { width: `${opportunity.demand}%` }
                ]} 
              />
            </View>
          </View>
          <View style={styles.requirements}>
            {opportunity.requirements.map((req, index) => (
              <View key={index} style={styles.requirement}>
                <Icon name="check-circle" type="material" size={16} color="#4CAF50" />
                <Text style={styles.requirementText}>{req}</Text>
              </View>
            ))}
          </View>
          <Button
            title="Connect with Buyer"
            buttonStyle={styles.connectButton}
            onPress={() => setSelectedProduct(opportunity.id)}
          />
        </Card>
      ))}
    </ScrollView>
  );

  const renderPriceAnalysis = () => (
    <Card containerStyle={styles.card}>
      <Card.Title>Price Trends</Card.Title>
      <View style={styles.chartContainer}>
        <LineChart
          style={styles.chart}
          data={{
            dataSets: [{
              values: priceHistory.map(h => ({
                x: h.timestamp,
                y: h.price
              })),
              label: 'Market Price',
            }],
          }}
          xAxis={{
            valueFormatter: 'date',
            granularityEnabled: true,
            granularity: 1,
          }}
        />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {renderPriceAnalysis()}
      {renderMarketOpportunities()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  marketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  marketText: {
    marginLeft: 4,
    marginRight: 12,
    color: '#757575',
  },
  distanceText: {
    marginLeft: 4,
    color: '#757575',
  },
  demandContainer: {
    marginVertical: 8,
  },
  demandLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  demandBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  demandFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  requirements: {
    marginVertical: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  requirementText: {
    marginLeft: 8,
    color: '#424242',
  },
  connectButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    marginTop: 8,
  },
  chartContainer: {
    height: 200,
    marginVertical: 8,
  },
  chart: {
    flex: 1,
  },
});
