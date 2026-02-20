jest.mock('../../src/lib/supabase');
jest.mock('../../src/services/parkReviews');

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useParkReviews } from '../../src/hooks/useParkReviews';
import * as parkReviewsService from '../../src/services/parkReviews';
import { createWrapper } from '../helpers/renderWithProviders';

const mockGetParkReviews = parkReviewsService.getParkReviews as jest.Mock;
const mockCreateParkReview = parkReviewsService.createParkReview as jest.Mock;
const mockVoteParkReview = parkReviewsService.voteParkReview as jest.Mock;
const mockDeleteParkReview = parkReviewsService.deleteParkReview as jest.Mock;
const mockReportParkReview = parkReviewsService.reportParkReview as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useParkReviews', () => {
  it('loads reviews on mount', async () => {
    const reviews = [
      { id: 'r1', content: 'Great park!', vote_count: 5, user_has_voted: false, created_at: '2024-06-01' },
    ];
    mockGetParkReviews.mockResolvedValue(reviews);

    const { result } = renderHook(() => useParkReviews('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.reviews).toEqual(reviews);
  });

  it('handles load failure gracefully', async () => {
    mockGetParkReviews.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useParkReviews('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.reviews).toEqual([]);
  });

  it('sorts reviews by votes by default', async () => {
    const reviews = [
      { id: 'r1', content: 'OK', vote_count: 2, created_at: '2024-06-02' },
      { id: 'r2', content: 'Great!', vote_count: 10, created_at: '2024-06-01' },
    ];
    mockGetParkReviews.mockResolvedValue(reviews);

    const { result } = renderHook(() => useParkReviews('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.reviews[0].id).toBe('r2');
    expect(result.current.sortBy).toBe('votes');
  });

  it('createReview calls service and refreshes', async () => {
    mockGetParkReviews.mockResolvedValue([]);
    mockCreateParkReview.mockResolvedValue(undefined);

    const { result } = renderHook(() => useParkReviews('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createReview('Nice park!');
    });

    expect(mockCreateParkReview).toHaveBeenCalledWith('p1', 'Nice park!', undefined);
  });

  it('vote toggles optimistically', async () => {
    const reviews = [
      { id: 'r1', content: 'Great!', vote_count: 5, user_has_voted: false, created_at: '2024-06-01' },
    ];
    mockGetParkReviews.mockResolvedValue(reviews);
    mockVoteParkReview.mockResolvedValue(undefined);

    const { result } = renderHook(() => useParkReviews('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.vote('r1');
    });

    expect(result.current.reviews[0].vote_count).toBe(6);
    expect(result.current.reviews[0].user_has_voted).toBe(true);
  });

  it('deleteReview removes from list optimistically', async () => {
    const reviews = [
      { id: 'r1', content: 'Great!', vote_count: 5, created_at: '2024-06-01' },
    ];
    mockGetParkReviews.mockResolvedValue(reviews);
    mockDeleteParkReview.mockResolvedValue(undefined);

    const { result } = renderHook(() => useParkReviews('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.reviews).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteReview('r1');
    });

    expect(result.current.reviews).toEqual([]);
  });
});
