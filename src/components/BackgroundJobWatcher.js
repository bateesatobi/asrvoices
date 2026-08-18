import React from 'react';
import useStudioUser from '../hooks/useStudioUser';
import useBackgroundJobs from '../hooks/useBackgroundJobs';

/** Mount once in the app shell — polls jobs and shows completion toasts. */
export default function BackgroundJobWatcher() {
  const { userId } = useStudioUser();
  useBackgroundJobs(userId);
  return null;
}
