jest.mock('../../src/lib/supabase');
jest.mock('../../src/services/parkPhotos');

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useParkPhotos } from '../../src/hooks/useParkPhotos';
import * as parkPhotosService from '../../src/services/parkPhotos';
import { createWrapper } from '../helpers/renderWithProviders';

const mockGetParkPhotos = parkPhotosService.getParkPhotos as jest.Mock;
const mockUploadParkPhoto = parkPhotosService.uploadParkPhoto as jest.Mock;
const mockVoteParkPhoto = parkPhotosService.voteParkPhoto as jest.Mock;
const mockDeleteParkPhoto = parkPhotosService.deleteParkPhoto as jest.Mock;
const mockReportParkPhoto = parkPhotosService.reportParkPhoto as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useParkPhotos', () => {
  it('loads photos on mount', async () => {
    const photos = [
      { id: 'ph1', url: 'https://example.com/1.jpg', vote_count: 3, user_has_voted: false },
    ];
    mockGetParkPhotos.mockResolvedValue(photos);

    const { result } = renderHook(() => useParkPhotos('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.photos).toEqual(photos);
    expect(result.current.featuredPhoto).toEqual(photos[0]);
  });

  it('handles load failure gracefully', async () => {
    mockGetParkPhotos.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useParkPhotos('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.photos).toEqual([]);
    expect(result.current.featuredPhoto).toBeNull();
  });

  it('upload adds new photo to list', async () => {
    mockGetParkPhotos.mockResolvedValue([]);
    const newPhoto = { id: 'ph2', url: 'https://example.com/2.jpg' };
    mockUploadParkPhoto.mockResolvedValue(newPhoto);

    const { result } = renderHook(() => useParkPhotos('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.upload('file:///photo.jpg');
    });

    expect(mockUploadParkPhoto).toHaveBeenCalledWith('test-user-id', 'p1', 'file:///photo.jpg');
    expect(result.current.photos).toContainEqual(newPhoto);
  });

  it('vote toggles optimistically', async () => {
    const photos = [
      { id: 'ph1', url: 'test.jpg', vote_count: 3, user_has_voted: false },
    ];
    mockGetParkPhotos.mockResolvedValue(photos);
    mockVoteParkPhoto.mockResolvedValue(undefined);

    const { result } = renderHook(() => useParkPhotos('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.vote('ph1');
    });

    expect(result.current.photos[0].vote_count).toBe(4);
    expect(result.current.photos[0].user_has_voted).toBe(true);
  });

  it('deletePhoto removes from list optimistically', async () => {
    const photos = [{ id: 'ph1', url: 'https://example.com/1.jpg' }];
    mockGetParkPhotos.mockResolvedValue(photos);
    mockDeleteParkPhoto.mockResolvedValue(undefined);

    const { result } = renderHook(() => useParkPhotos('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.photos).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deletePhoto('ph1', 'https://example.com/1.jpg');
    });

    expect(result.current.photos).toEqual([]);
  });
});
