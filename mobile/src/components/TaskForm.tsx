import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { TaskPriority } from '../types/task';
import { validateTaskInput } from '../utils/validation';

interface Props {
  onSubmit: (input: {
    title: string;
    description: string;
    deadline: string | null;
    priority: TaskPriority;
  }) => void;
  submitting: boolean;
}

// Controlled form: every input is React state; validation runs on submit
// for instant UX feedback (server re-validates independently).
export function TaskForm({ onSubmit, submitting }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(''); // ISO string, e.g. 2026-10-05T18:00
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const err = validateTaskInput(title);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      deadline: deadline.trim() ? new Date(deadline.trim()).toISOString() : null,
      priority,
    });
    setTitle('');
    setDescription('');
    setDeadline('');
  };

  return (
    <View style={styles.box}>
      <TextInput
        style={styles.input}
        placeholder="Task title *"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Deadline ISO (optional, e.g. 2026-10-05T18:00)"
        value={deadline}
        onChangeText={setDeadline}
      />
      <View style={styles.row}>
        {Object.values(TaskPriority).map((p) => (
          <Text
            key={p}
            onPress={() => setPriority(p)}
            style={[styles.pill, priority === p && styles.pillActive]}>
            {p}
          </Text>
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={submitting ? 'Adding…' : 'Add task'} onPress={submit} disabled={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  pill: { padding: 8, borderRadius: 16, backgroundColor: '#e0e0e0', marginRight: 8, overflow: 'hidden' },
  pillActive: { backgroundColor: '#90caf9' },
  error: { color: '#d32f2f', marginBottom: 8 },
});
