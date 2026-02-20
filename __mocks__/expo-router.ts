const push = jest.fn();
const back = jest.fn();
const replace = jest.fn();
const canGoBack = jest.fn(() => true);

export const useRouter = () => ({ push, back, replace, canGoBack });
export const useLocalSearchParams = jest.fn(() => ({}));
export const useSegments = jest.fn(() => []);
export const usePathname = jest.fn(() => '/');
export const Link = ({ children }: any) => children;
export const router = { push, back, replace, canGoBack };
export const useFocusEffect = (callback: any) => { callback(); };
export const Redirect = ({ href }: { href: string }) => null;
