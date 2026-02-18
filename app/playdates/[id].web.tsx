import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SEOHead } from '@/src/components/seo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, isSameDay } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { usePlaydateDetail } from '@/src/hooks/usePlaydateDetail';
import { useResponsiveLayout } from '@/src/hooks/useResponsiveLayout';
import WebPageLayout from '@/src/components/ui/WebPageLayout';
import { Skeleton, SkeletonList } from '@/src/components/ui/Skeleton';
import type { PlayDateRSVP } from '@/src/types/database';

function formatDateRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  const datePart = format(start, 'EEEE, MMMM d, yyyy');
  const startTime = format(start, 'h:mm a');
  const endTime = format(end, 'h:mm a');

  if (isSameDay(start, end)) {
    return `${datePart} \u00b7 ${startTime} - ${endTime}`;
  }

  return `${datePart} ${startTime} to ${format(end, 'EEEE, MMMM d, yyyy')} ${endTime}`;
}

function RsvpItem({ rsvp, userId, variant }: { rsvp: PlayDateRSVP; userId?: string; variant: 'going' | 'maybe' }) {
  const isGoing = variant === 'going';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EDECEA',
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isGoing ? '#3D8A5A' : '#D4A64A',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
          {(rsvp.profile?.display_name ?? rsvp.profile?.email ?? '?').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1918' }}>
          {rsvp.profile?.display_name ?? rsvp.profile?.email ?? 'Unknown'}
          {rsvp.user_id === userId ? ' (You)' : ''}
        </Text>
        {rsvp.dog && (
          <Text style={{ fontSize: 13, color: '#6D6C6A', marginTop: 1 }}>
            with {rsvp.dog.name}
            {rsvp.dog.breed ? ` (${rsvp.dog.breed})` : ''}
          </Text>
        )}
      </View>
      <View
        style={{
          backgroundColor: isGoing ? '#E8F0E8' : '#F5EFE0',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 10,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '600', color: isGoing ? '#4A6B4A' : '#D4A64A' }}>
          {isGoing ? 'Going' : 'Maybe'}
        </Text>
      </View>
    </View>
  );
}

export default function PlayDateDetailWebScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isMobile, isDesktop } = useResponsiveLayout();

  const {
    playdate,
    loading,
    error,
    actionLoading,
    dogs,
    userId,
    isOrganizer,
    isCancelled,
    userRsvp,
    goingRsvps,
    maybeRsvps,
    showDogPicker,
    setShowDogPicker,
    loadPlaydate,
    handleCancel,
    handleRsvp,
    handleCancelRsvp,
  } = usePlaydateDetail(id);

  const header = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: isMobile ? 16 : 40,
        paddingVertical: isMobile ? 16 : 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E4E1',
      }}
    >
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
      </Pressable>
      {loading ? (
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Skeleton width={isMobile ? 180 : 240} height={isMobile ? 20 : 24} borderRadius={4} />
        </View>
      ) : (
        <Text
          style={{ fontSize: isMobile ? 18 : 24, fontWeight: '600', color: '#1A1918', marginLeft: 12, flex: 1 }}
          numberOfLines={1}
        >
          {playdate?.title || 'Play Date'}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <>
      <SEOHead title="Playdate Details" description="View playdate details and RSVP on k9d8." url="/playdates" />
      <WebPageLayout header={header} maxWidth={1000}>
        <View style={{ padding: isMobile ? 20 : 28 }}>
          {/* Title Skeleton */}
          <Skeleton width={isMobile ? 240 : 320} height={isMobile ? 26 : 32} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width={isMobile ? 180 : 240} height={16} borderRadius={3} style={{ marginBottom: 24 }} />
          
          {/* Details Card Skeleton */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: isMobile ? 20 : 28, marginBottom: 24 }}>
            <Skeleton width="80%" height={isMobile ? 24 : 28} borderRadius={4} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={14} borderRadius={3} style={{ marginBottom: 8 }} />
            <Skeleton width="90%" height={14} borderRadius={3} style={{ marginBottom: 24 }} />
            
            {/* Info Rows Skeleton */}
            <Skeleton width="100%" height={60} borderRadius={8} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={60} borderRadius={8} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={60} borderRadius={8} />
          </View>
          
          {/* RSVP Section Skeleton */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: isMobile ? 20 : 28 }}>
            <Skeleton width={120} height={18} borderRadius={3} style={{ marginBottom: 16 }} />
            <SkeletonList count={3} type="card" />
          </View>
        </View>
      </WebPageLayout>
      </>
    );
  }

  if (error || !playdate) {
    return (
      <>
      <SEOHead title="Playdate Details" description="View playdate details and RSVP on k9d8." url="/playdates" />
      <WebPageLayout header={header} maxWidth={1000}>
        <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 64 }}>
          <Text style={{ fontSize: 16, color: '#B5725E', textAlign: 'center', marginBottom: 16 }}>
            {error ?? 'Play date not found'}
          </Text>
          <Pressable
            onPress={loadPlaydate}
            style={{ backgroundColor: '#3D8A5A', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      </WebPageLayout>
      </>
    );
  }

  return (
    <>
    <SEOHead title="Playdate Details" description="View playdate details and RSVP on k9d8." url="/playdates" />
    <WebPageLayout header={header} maxWidth={1000}>
      {/* Cancelled Banner */}
      {isCancelled && (
        <View style={{ backgroundColor: '#F5E8E3', padding: 12, borderRadius: 8, marginBottom: 24 }}>
          <Text style={{ color: '#B5725E', fontWeight: '600', textAlign: 'center', fontSize: 14 }}>
            This play date has been cancelled
          </Text>
        </View>
      )}

      <View
        style={{
          flexDirection: isDesktop ? 'row' : 'column',
          gap: isDesktop ? 32 : 24,
        }}
      >
        {/* Left Column — Details + RSVPs */}
        <View style={{ flex: isDesktop ? 2 : undefined }}>
          {/* Details Card */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: isMobile ? 20 : 28, marginBottom: 24 }}>
            <Text style={{ fontSize: isMobile ? 22 : 28, fontWeight: '700', color: '#1A1918', marginBottom: 8 }}>
              {playdate.title}
            </Text>
            {playdate.description ? (
              <Text style={{ fontSize: 15, color: '#6D6C6A', lineHeight: 22, marginBottom: 16 }}>
                {playdate.description}
              </Text>
            ) : null}

            {/* Info Rows */}
            {playdate.park && (
              <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDECEA' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#878685', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Park</Text>
                <Text style={{ fontSize: 16, color: '#1A1918', fontWeight: '500' }}>{playdate.park.name}</Text>
                {playdate.park.address && (
                  <Text style={{ fontSize: 13, color: '#6D6C6A', marginTop: 2 }}>{playdate.park.address}</Text>
                )}
              </View>
            )}

            <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDECEA' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#878685', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>When</Text>
              <Text style={{ fontSize: 16, color: '#1A1918', fontWeight: '500' }}>
                {formatDateRange(playdate.starts_at, playdate.ends_at)}
              </Text>
            </View>

            {playdate.max_dogs != null && (
              <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDECEA' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#878685', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Max Dogs</Text>
                <Text style={{ fontSize: 16, color: '#1A1918', fontWeight: '500' }}>{playdate.max_dogs}</Text>
              </View>
            )}

            {playdate.organizer && (
              <View style={{ paddingVertical: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#878685', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Organizer</Text>
                <Text style={{ fontSize: 16, color: '#1A1918', fontWeight: '500' }}>
                  {playdate.organizer.display_name ?? playdate.organizer.email}
                  {isOrganizer ? ' (You)' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* RSVPs Card */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: isMobile ? 20 : 28 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918', marginBottom: 12 }}>
              Who's Coming ({goingRsvps.length})
            </Text>
            {goingRsvps.length === 0 ? (
              <Text style={{ fontSize: 14, color: '#878685', textAlign: 'center', paddingVertical: 20 }}>
                No one has RSVP'd yet. Be the first!
              </Text>
            ) : (
              goingRsvps.map((rsvp) => (
                <RsvpItem key={rsvp.id} rsvp={rsvp} userId={userId} variant="going" />
              ))
            )}

            {maybeRsvps.length > 0 && (
              <>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918', marginBottom: 12, marginTop: 20 }}>
                  Maybe ({maybeRsvps.length})
                </Text>
                {maybeRsvps.map((rsvp) => (
                  <RsvpItem key={rsvp.id} rsvp={rsvp} userId={userId} variant="maybe" />
                ))}
              </>
            )}
          </View>
        </View>

        {/* Right Column — Actions */}
        {!isCancelled && (
          <View style={{ flex: isDesktop ? 1 : undefined, minWidth: isDesktop ? 280 : undefined }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: isMobile ? 20 : 28 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1918', marginBottom: 16 }}>
                Actions
              </Text>

              {actionLoading ? (
                <ActivityIndicator size="small" color="#3D8A5A" />
              ) : isOrganizer ? (
                <Pressable
                  onPress={handleCancel}
                  style={{
                    backgroundColor: '#F5E8E3',
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#B5725E', fontSize: 16, fontWeight: '600' }}>Cancel Play Date</Text>
                </Pressable>
              ) : userRsvp ? (
                <View style={{ gap: 10 }}>
                  <View style={{ backgroundColor: '#E8F0E8', borderRadius: 12, padding: 14, alignItems: 'center' }}>
                    <Text style={{ color: '#4A6B4A', fontSize: 14, fontWeight: '600' }}>
                      You're {userRsvp.status === 'going' ? 'going' : 'maybe going'}
                      {userRsvp.dog ? ` with ${userRsvp.dog.name}` : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={handleCancelRsvp}
                    style={{
                      borderWidth: 1,
                      borderColor: '#E5E4E1',
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#6D6C6A', fontSize: 14, fontWeight: '600' }}>Cancel RSVP</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setShowDogPicker(true)}
                  style={{
                    backgroundColor: '#3D8A5A',
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>RSVP</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Dog Picker Modal */}
      <Modal
        visible={showDogPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDogPicker(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              width: isMobile ? '90%' : 440,
              maxHeight: '70%',
              overflow: 'hidden',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E4E1' }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918' }}>Select Your Dog</Text>
              <Pressable onPress={() => setShowDogPicker(false)}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#3D8A5A' }}>Cancel</Text>
              </Pressable>
            </View>
            {dogs.length === 0 ? (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#878685', textAlign: 'center', lineHeight: 20 }}>
                  You haven't added any dogs yet.{'\n'}Add a dog in your profile first.
                </Text>
              </View>
            ) : (
              <View style={{ padding: 16 }}>
                {dogs.map((dog) => (
                  <Pressable
                    key={dog.id}
                    onPress={() => handleRsvp(dog)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 14,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#E5E4E1',
                      marginBottom: 10,
                    }}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#3D8A5A', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                        {dog.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1918' }}>{dog.name}</Text>
                      {dog.breed && (
                        <Text style={{ fontSize: 13, color: '#6D6C6A', marginTop: 2 }}>{dog.breed}</Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </WebPageLayout>
    </>
  );
}
