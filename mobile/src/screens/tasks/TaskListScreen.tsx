import React, { useEffect } from 'react';
import { Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import {
  addTask,
  fetchTasks,
  removeTask,
  setFilter,
  setSearch,
  toggleTask,
} from '../../store/tasksSlice';
import { TaskCard } from '../../components/TaskCard';
import { TaskForm } from '../../components/TaskForm';
import { TaskStatus } from '../../types/task';

// Main screen: task list (FlatList) + add-task form + search/filter.
// Data comes from Redux; Redux thunks call the backend with the Firebase ID token.
export function TaskListScreen() {
  const dispatch = useAppDispatch();
  const { items, loading, error, filter, search } = useAppSelector((s) => s.tasks);

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  const visible = items.filter((t) => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search && !`${t.title} ${t.description}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <View style={styles.container}>
      <TaskForm onSubmit={(input) => dispatch(addTask(input))} submitting={loading} />
      <View style={styles.row}>
        {(['all', TaskStatus.PENDING, TaskStatus.COMPLETED] as const).map((f) => (
          <Text key={f} onPress={() => dispatch(setFilter(f))} style={[styles.pill, filter === f && styles.active]}>
            {f}
          </Text>
        ))}
      </View>
      <TextInput
        style={styles.search}
        placeholder="Search tasks…"
        value={search}
        onChangeText={(v) => dispatch(setSearch(v))}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && items.length === 0 ? (
        <Text style={styles.center}>Loading tasks…</Text>
      ) : visible.length === 0 ? (
        <Text style={styles.center}>No tasks yet. Add your first task above.</Text>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(t) => t._id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onToggle={() => dispatch(toggleTask({ id: item._id, status: item.status }))}
              onDelete={() => dispatch(removeTask(item._id))}
            />
          )}
          onRefresh={() => dispatch(fetchTasks())}
          refreshing={loading}
        />
      )}
      <Button title="Sign out" onPress={() => auth().signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fafafa' },
  row: { flexDirection: 'row', marginVertical: 6 },
  pill: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
    overflow: 'hidden',
  },
  active: { backgroundColor: '#90caf9' },
  search: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 6,
  },
  error: { color: '#d32f2f', marginBottom: 6, textAlign: 'center' },
  center: { textAlign: 'center', marginTop: 20, color: '#666' },
});
