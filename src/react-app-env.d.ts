/// <reference types="react-scripts" />

declare module 'react' {
  // React Component Types
  export type FC<P = {}> = React.FunctionComponent<P>;
  export type ReactNode = React.ReactNode;
  export type ReactElement = React.ReactElement;
  export type ReactPortal = React.ReactPortal;
  export type ComponentType<P = {}> = React.ComponentType<P>;
  export type Component<P = {}, S = {}> = React.Component<P, S>;
  export type PureComponent<P = {}, S = {}> = React.PureComponent<P, S>;
  export type ClassAttributes<T> = React.ClassAttributes<T>;
  export type JSXElementConstructor<P> = React.JSXElementConstructor<P>;
  export type CSSProperties = React.CSSProperties;
  export type PropsWithChildren<P> = React.PropsWithChildren<P>;
  export type PropsWithRef<P> = React.PropsWithRef<P>;
  export type RefAttributes<T> = React.RefAttributes<T>;
  export type StrictMode = React.StrictMode;
  export const StrictMode: React.FC<{ children?: React.ReactNode }>;
  export const Fragment: React.FC<{ children?: React.ReactNode }>;
  
  // Event Types
  export type FormEvent<T = Element> = React.FormEvent<T>;
  export type ChangeEvent<T = Element> = React.ChangeEvent<T>;
  export type MouseEvent<T = Element> = React.MouseEvent<T>;
  export type KeyboardEvent<T = Element> = React.KeyboardEvent<T>;
  export type FocusEvent<T = Element> = React.FocusEvent<T>;
  export type SyntheticEvent<T = Element, E = Event> = React.SyntheticEvent<T, E>;
  export type BaseSyntheticEvent<E = object, C = any, T = any> = React.BaseSyntheticEvent<E, C, T>;
  
  // Event Handler Types
  export type ReactEventHandler<T = Element> = React.ReactEventHandler<T>;
  export type ClipboardEventHandler<T = Element> = React.ClipboardEventHandler<T>;
  export type DragEventHandler<T = Element> = React.DragEventHandler<T>;
  export type FocusEventHandler<T = Element> = React.FocusEventHandler<T>;
  export type FormEventHandler<T = Element> = React.FormEventHandler<T>;
  export type ChangeEventHandler<T = Element> = React.ChangeEventHandler<T>;
  export type KeyboardEventHandler<T = Element> = React.KeyboardEventHandler<T>;
  export type MouseEventHandler<T = Element> = React.MouseEventHandler<T>;
  export type TouchEventHandler<T = Element> = React.TouchEventHandler<T>;
  export type PointerEventHandler<T = Element> = React.PointerEventHandler<T>;
  export type UIEventHandler<T = Element> = React.UIEventHandler<T>;
  export type WheelEventHandler<T = Element> = React.WheelEventHandler<T>;
  export type AnimationEventHandler<T = Element> = React.AnimationEventHandler<T>;
  export type TransitionEventHandler<T = Element> = React.TransitionEventHandler<T>;
  
  // Ref Types
  export type Ref<T> = React.Ref<T>;
  export type RefObject<T> = React.RefObject<T>;
  export type MutableRefObject<T> = React.MutableRefObject<T>;
  export type RefCallback<T> = React.RefCallback<T>;
  export type LegacyRef<T> = React.LegacyRef<T>;
  
  // Context Types
  export type Context<T> = React.Context<T>;
  export type Provider<T> = React.Provider<T>;
  export type Consumer<T> = React.Consumer<T>;
  
  // State and Effect Types
  export type Dispatch<A> = React.Dispatch<A>;
  export type SetStateAction<S> = React.SetStateAction<S>;
  export type EffectCallback = React.EffectCallback;
  export type DependencyList = React.DependencyList;
  export type Reducer<S, A> = React.Reducer<S, A>;
  export type ReducerState<R extends React.Reducer<any, any>> = React.ReducerState<R>;
  export type ReducerAction<R extends React.Reducer<any, any>> = React.ReducerAction<R>;
  
  // Validation Types
  export type Validator<T> = React.Validator<T>;
  export type Requireable<T> = React.Requireable<T>;
  export type ValidationMap<T> = React.ValidationMap<T>;
  export type WeakValidationMap<T> = React.WeakValidationMap<T>;
  
  // HTML Types
  export type HTMLAttributes<T> = React.HTMLAttributes<T>;
  export type DetailedHTMLProps<E extends React.HTMLAttributes<T>, T> = React.DetailedHTMLProps<E, T>;
  export type SVGAttributes<T> = React.SVGAttributes<T>;
  
  // React Hooks
  export function useState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>];
  export function useState<S = undefined>(): [S | undefined, React.Dispatch<React.SetStateAction<S | undefined>>];
  export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
  export function useContext<T>(context: React.Context<T>): T;
  export function useReducer<R extends React.Reducer<any, any>, I>(
    reducer: R,
    initializerArg: I & React.ReducerState<R>,
    initializer: (arg: I & React.ReducerState<R>) => React.ReducerState<R>
  ): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>];
  export function useReducer<R extends React.Reducer<any, any>>(
    reducer: R,
    initializerArg: React.ReducerState<R>,
    initializer?: undefined
  ): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>];
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: React.DependencyList): T;
  export function useMemo<T>(factory: () => T, deps: React.DependencyList | undefined): T;
  export function useRef<T>(initialValue: T): React.MutableRefObject<T>;
  export function useRef<T>(initialValue: T | null): React.RefObject<T>;
  export function useRef<T = undefined>(): React.MutableRefObject<T | undefined>;
  export function useImperativeHandle<T, R extends T>(
    ref: React.Ref<T> | undefined,
    init: () => R,
    deps?: React.DependencyList
  ): void;
  export function useLayoutEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
  export function useDebugValue<T>(value: T, format?: (value: T) => any): void;
  
  // Context Creation
  export function createContext<T>(defaultValue: T): React.Context<T>;
  export function createElement(
    type: string | React.ComponentType<any>,
    props?: any,
    ...children: React.ReactNode[]
  ): React.ReactElement;
}

declare module 'react-dom';
declare module 'react-router-dom';

interface Window {
  confirm(message?: string): boolean;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    REACT_APP_API_URL?: string;
    REACT_APP_USE_REAL_API?: string;
  }
}
