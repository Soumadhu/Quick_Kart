import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';

const EarningsScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('daily'); // 'daily' or 'weekly'
  
  // Sample data - replace with actual data from your API
  const dailyEarnings = [
    { day: 'Mon', amount: 120 },
    { day: 'Tue', amount: 190 },
    { day: 'Wed', amount: 150 },
    { day: 'Thu', amount: 210 },
    { day: 'Fri', amount: 180 },
    { day: 'Sat', amount: 250 },
    { day: 'Sun', amount: 200 },
  ];

  const weeklyEarnings = [
    { week: 'Week 1', amount: 1200 },
    { week: 'Week 2', amount: 1500 },
    { week: 'Week 3', amount: 1350 },
    { week: 'Week 4', amount: 1700 },
  ];

  const currentData = selectedPeriod === 'daily' ? dailyEarnings : weeklyEarnings;
  const totalEarnings = currentData.reduce((sum, item) => sum + item.amount, 0);
  const totalDeliveries = currentData.length * (selectedPeriod === 'daily' ? 5 : 1);

  const chartData = {
    labels: currentData.map(item => selectedPeriod === 'daily' ? item.day : item.week),
    datasets: [{
      data: currentData.map(item => item.amount),
      color: (opacity = 1) => `rgba(248, 196, 0, ${opacity})`,
      strokeWidth: 2
    }]
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Earnings</Text>
      </View>

      <View style={styles.periodSelector}>
        <TouchableOpacity 
          style={[styles.periodButton, selectedPeriod === 'daily' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('daily')}
        >
          <Text style={[styles.periodButtonText, selectedPeriod === 'daily' && styles.periodButtonTextActive]}>
            Daily
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.periodButton, selectedPeriod === 'weekly' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('weekly')}
        >
          <Text style={[styles.periodButtonText, selectedPeriod === 'weekly' && styles.periodButtonTextActive]}>
            Weekly
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Earnings</Text>
            <Text style={styles.summaryValue}>₹{totalEarnings.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Deliveries</Text>
            <Text style={styles.summaryValue}>{totalDeliveries}</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>
            {selectedPeriod === 'daily' ? 'Daily' : 'Weekly'} Earnings
          </Text>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 32}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.earningsList}>
          <Text style={styles.sectionTitle}>
            {selectedPeriod === 'daily' ? 'Daily' : 'Weekly'} Breakdown
          </Text>
          {currentData.map((item, index) => (
            <View key={index} style={styles.earningItem}>
              <Text style={styles.earningPeriod}>
                {selectedPeriod === 'daily' ? item.day : item.week}
              </Text>
              <Text style={styles.earningAmount}>₹{item.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#F8C400',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  earningsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  earningItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  earningPeriod: {
    fontSize: 14,
    color: '#666',
  },
  earningAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default EarningsScreen;
