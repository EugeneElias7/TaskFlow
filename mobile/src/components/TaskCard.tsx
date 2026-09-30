import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TaskDto, TaskPriority, TaskStatus } from '../types/task';

interface Props {
  task: TaskDto;
  onToggle: () => void;
  onDelete: () => void;
}

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  high: '#d32f2f',
  medium: '#f9a825',
  low: '#388e3c',
};

// Single row in the FlatList. Stateless: all data + callbacks come from props.
export function TaskCard({ task, onToggle, onDelete }: Props) {
  const done = task.status === TaskStatus.COMPLETED;
  return (
    <View style={[styles.card, done && styles.cardDone]}>
      <TouchableOpacity onPress={onToggle} style={styles.checkbox} accessibilityRole="checkbox">
        <Text>{done ? '☑' : '☐'}</Text>
      </TouchableOpacity>
      <View style={styles.body}>
        <Text style={[styles.title, done && styles.strike]}>{task.title}</Text>
        {task.description ? <Text style={styles.desc}>{task.description}</Text> : null}
        <Text style={styles.meta}>
          <Text style={{ color: PRIORITY_COLOR[task.priority] }}>● {task.priority}</Text>
          {task.deadline ? `  •  due ${new Date(task.deadline).toLocaleString()}` : ''}
          {`  •  ${task.status}`}
        </Text>
      </View>
      <TouchableOpacity onPress={onDelete} accessibilityRole="button" accessibilityLabel="Delete task">
        <Text style={styles.delete}>🗑</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    elevation: 2,
  },
  cardDone: { opacity: 0.6 },
  checkbox: { padding: 6, marginRight: 6 },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#111' },
  strike: { textDecorationLine: 'line-through' },
  desc: { color: '#555', marginTop: 2 },
  meta: { color: '#777', fontSize: 12, marginTop: 4 },
  delete: { fontSize: 18, padding: 6 },
});
