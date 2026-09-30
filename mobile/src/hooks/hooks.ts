import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';

// Typed hooks so components get type-safe dispatch/select without imports
// of the store types everywhere. LEARNING POINT: selector = a function
// that reads a slice of Redux state.
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
