jest.mock('../../src/lib/supabase');
jest.mock('../../src/services/dogs');

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useDogs } from '../../src/hooks/useDogs';
import * as dogsService from '../../src/services/dogs';

const mockGetDogsByOwner = dogsService.getDogsByOwner as jest.Mock;
const mockCreateDog = dogsService.createDog as jest.Mock;
const mockUpdateDog = dogsService.updateDog as jest.Mock;
const mockDeleteDog = dogsService.deleteDog as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useDogs', () => {
  it('loads dogs on mount', async () => {
    const dogs = [{ id: 'd1', name: 'Buddy' }];
    mockGetDogsByOwner.mockResolvedValue(dogs);

    const { result } = renderHook(() => useDogs('u1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.dogs).toEqual(dogs);
  });

  it('does not load when ownerId is undefined', async () => {
    const { result } = renderHook(() => useDogs(undefined));
    expect(mockGetDogsByOwner).not.toHaveBeenCalled();
  });

  it('sets error on load failure', async () => {
    mockGetDogsByOwner.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDogs('u1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Network error');
  });

  it('addDog creates and prepends to list', async () => {
    mockGetDogsByOwner.mockResolvedValue([]);
    const newDog = { id: 'd2', name: 'Max' };
    mockCreateDog.mockResolvedValue(newDog);

    const { result } = renderHook(() => useDogs('u1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addDog({ name: 'Max', owner_id: 'u1' } as any);
    });

    expect(result.current.dogs).toEqual([newDog]);
  });

  it('editDog updates dog in list', async () => {
    const dog = { id: 'd1', name: 'Buddy' };
    mockGetDogsByOwner.mockResolvedValue([dog]);
    const updated = { id: 'd1', name: 'Buddy Jr' };
    mockUpdateDog.mockResolvedValue(updated);

    const { result } = renderHook(() => useDogs('u1'));

    await waitFor(() => {
      expect(result.current.dogs.length).toBe(1);
    });

    await act(async () => {
      await result.current.editDog('d1', { name: 'Buddy Jr' });
    });

    expect(result.current.dogs[0].name).toBe('Buddy Jr');
  });

  it('removeDog deletes and removes from list', async () => {
    mockGetDogsByOwner.mockResolvedValue([{ id: 'd1', name: 'Buddy' }]);
    mockDeleteDog.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDogs('u1'));

    await waitFor(() => {
      expect(result.current.dogs.length).toBe(1);
    });

    await act(async () => {
      await result.current.removeDog('d1');
    });

    expect(result.current.dogs).toEqual([]);
  });
});
