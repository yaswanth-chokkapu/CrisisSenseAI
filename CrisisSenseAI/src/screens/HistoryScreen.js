import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { theme } from '../constants/theme';

export const HistoryScreen = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAlerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAlerts(fetchedAlerts);
      setLoading(false);
    }, (error) => {
      console.warn("Error fetching history:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => {
    const date = item.timestamp?.toDate ? item.timestamp.toDate() : new Date();
    const formattedDate = date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.type}>
            {item.reason ? `Witness Report: ${item.reason.toUpperCase()}` : 'Self Emergency'}
          </Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        <Text style={styles.detail}>Notified: {item.notifiedHospital || 'Unknown'}</Text>
        {item.risk && <Text style={styles.detail}>Risk Level: {item.risk}</Text>}
        {item.description ? <Text style={styles.detail}>Notes: {item.description}</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alert History</Text>
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : alerts.length === 0 ? (
        <Text style={styles.empty}>No past alerts.</Text>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.large },
  title: { color: theme.colors.textPrimary, fontSize: theme.typography.sizes.heading, fontWeight: 'bold', marginBottom: theme.spacing.medium, marginTop: theme.spacing.xl },
  empty: { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily },
  card: { backgroundColor: theme.colors.surface, padding: theme.spacing.medium, borderRadius: theme.borderRadius.card, marginBottom: theme.spacing.medium },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.xs, alignItems: 'center' },
  type: { color: theme.colors.primary, fontWeight: 'bold', fontSize: theme.typography.sizes.body, flex: 1 },
  date: { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.small, marginLeft: 10 },
  detail: { color: theme.colors.textPrimary, marginTop: theme.spacing.xs, fontSize: theme.typography.sizes.small, fontFamily: theme.typography.fontFamily }
});
