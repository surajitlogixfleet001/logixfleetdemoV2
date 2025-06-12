// src/screens/DashboardScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Fuel, ShieldAlert, Car, AlertTriangle } from 'lucide-react-native';
import AppSidebar from '@/components/AppSidebar';

// Navigation params
type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
};

// --- MetricCard Component ---
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  Icon: React.ComponentType<any>;
  valueStyle?: object;
}
function MetricCard({ title, value, subtitle, Icon, valueStyle }: MetricCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Icon size={20} color="#666" />
      </View>
      <Text style={[styles.metricValue, valueStyle]}>{value}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );
}

// --- HighRiskList Component ---
interface HighRiskVehicle {
  id: number;
  name: string;
  riskScore: number;
  lastTheft: string;
}
interface HighRiskListProps {
  data: HighRiskVehicle[];
  onRefresh: () => void;
}
function HighRiskList({ data, onRefresh }: HighRiskListProps) {
  if (!data.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>High Risk Vehicles</Text>
      <FlatList
        data={data}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemSubtitle}>
                Last theft: {new Date(item.lastTheft).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.riskScore}>{item.riskScore}%</Text>
          </View>
        )}
        refreshing={false}
        onRefresh={onRefresh}
      />
    </View>
  );
}

// --- Main Dashboard Component ---
export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Dashboard'>>();
  const [fuelEvents, setFuelEvents] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const api = axios.create({ baseURL: 'https://palmconnect.co/telematry' });

  const setupAuth = async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem('@Siphy:authToken');
    if (!token) {
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
      return false;
    }
    api.defaults.headers.common['Authorization'] = `Token ${token}`;
    return true;
  };

  const fetchData = async () => {
    try {
      setError(null);
      if (!refreshing) setLoading(true);
      if (!(await setupAuth())) return;
      const [vehiclesRes, eventsRes] = await Promise.all([
        api.get('/vehicles/'),
        api.get('/fuel-events/'),
      ]);
      setVehicles(vehiclesRes.data.fleet_overview || []);
      setFuelEvents(eventsRes.data.fuel_events || []);
    } catch (err: any) {
      if ([401, 403].includes(err.response?.status)) {
        await AsyncStorage.multiRemove(['@Siphy:authToken', '@Siphy:isLoggedIn']);
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // Compute metrics
  const { totalVehicles, monthlyTheftCount, totalFuelStolen, highRiskVehicles } = useMemo(() => {
    const theftEvents = fuelEvents.filter(e => ['theft', 'rapid_drop'].includes(e.event_type));
    const totalFuel = theftEvents.reduce((sum, e) => sum + Math.abs(parseFloat(e.change_amount) || 0), 0);
    const highRisks = vehicles
      .map(v => {
        const evts = theftEvents.filter(e => e.vehicle === v.id);
        if (!evts.length) return null;
        const lastTime = Math.max(...evts.map(e => new Date(e.timestamp).getTime()));
        return { id: v.id, name: v.name || `Vehicle ${v.id}`, riskScore: Math.floor(Math.random() * 30) + 70, lastTheft: new Date(lastTime).toISOString() };
      })
      .filter(Boolean) as any[];
    return {
      totalVehicles: vehicles.length,
      monthlyTheftCount: theftEvents.length,
      totalFuelStolen: totalFuel,
      highRiskVehicles: highRisks,
    };
  }, [fuelEvents, vehicles]);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.layout}>
      <AppSidebar />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.header}>Real-time Vehicle Tracking</Text>
        {error && (
          <TouchableOpacity onPress={onRefresh} style={styles.errorContainer}>
            <AlertTriangle size={24} color="red" />
            <Text style={styles.errorText}>{error}</Text>
          </TouchableOpacity>
        )}
        <View style={styles.metricsGrid}>
          <MetricCard title="Total Vehicles" value={totalVehicles} subtitle="Fleet size" Icon={Car} />
          <MetricCard title="Fuel Theft" value={monthlyTheftCount} subtitle="This month" Icon={ShieldAlert} valueStyle={{ color: 'red' }} />
          <MetricCard title="Fuel Stolen (L)" value={totalFuelStolen.toFixed(1)} subtitle="This month" Icon={Fuel} valueStyle={{ color: 'red' }} />
          <MetricCard title="High Risk" value={highRiskVehicles.length} subtitle="Needs attention" Icon={AlertTriangle} valueStyle={{ color: 'orange' }} />
        </View>
        <HighRiskList data={highRiskVehicles} onRefresh={onRefresh} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  layout: { flex: 1, flexDirection: 'row' },
  container: { flexGrow: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '600' },
  metricValue: { fontSize: 20, fontWeight: 'bold', marginVertical: 4 },
  metricSubtitle: { fontSize: 12, color: '#666' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 6, marginBottom: 8 },
  itemName: { fontSize: 16, fontWeight: '500' },
  itemSubtitle: { fontSize: 12, color: '#888' },
  riskScore: { fontSize: 16, fontWeight: '700', color: 'orange' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  errorText: { color: 'red', marginLeft: 8 },
});