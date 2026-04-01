import path from 'node:path';
import { Notification, shell, systemPreferences } from 'electron';
import type { ConvertStatusChangedEvent } from '@turner/contracts';
import type { Logger } from '@turner/observability';

const MAX_NOTIFICATION_TEXT_LENGTH = 140;

const shorten = (value: string): string => {
  const normalized = value.trim();
  return normalized.length <= MAX_NOTIFICATION_TEXT_LENGTH
    ? normalized
    : `${normalized.slice(0, MAX_NOTIFICATION_TEXT_LENGTH - 3)}...`;
};

const buildNotificationContent = (
  event: ConvertStatusChangedEvent
): { title: string; body: string } | undefined => {
  const fileName = path.basename(event.inputPath);

  if (event.status === 'done') {
    return {
      title: 'Turner Studio: Conversion completed',
      body: shorten(`${fileName} is now ready as MP4.`)
    };
  }

  if (event.status === 'failed') {
    return {
      title: 'Turner Studio: Conversion failed',
      body: shorten(event.error?.message ?? `${fileName} could not be converted.`)
    };
  }

  return undefined;
};

/**
 * Returns true only when the OS will actually deliver the notification.
 * Logs a clear warning when blocked so users can diagnose the issue.
 */
const isNotificationDeliverable = (logger: Logger): boolean => {
  if (!Notification.isSupported()) {
    logger.warn('Desktop notifications are not supported on this platform');
    return false;
  }

  // macOS: check authorization status when the runtime API is available.
  // `getNotificationsAuthorizationStatus` is macOS-only and may not be present
  // in all Electron builds — guard at runtime rather than relying on typedefs.
  if (process.platform === 'darwin') {
    const prefs = systemPreferences as unknown as Record<string, unknown>;
    if (typeof prefs['getNotificationsAuthorizationStatus'] === 'function') {
      const status = (prefs['getNotificationsAuthorizationStatus'] as () => string)();
      if (status === 'denied') {
        logger.warn(
          'macOS notifications are denied for this app. ' +
          'Go to System Settings → Notifications → Turner Studio and enable them.'
        );
        return false;
      }
      // 'provisional' or 'not-determined' → attempt delivery; macOS may prompt user.
    }
  }

  return true;
};

export const showConversionStatusNotification = (
  event: ConvertStatusChangedEvent,
  logger: Logger
): void => {
  const content = buildNotificationContent(event);
  if (!content) return;

  if (!isNotificationDeliverable(logger)) return;

  try {
    const notification = new Notification({
      title: content.title,
      body: content.body,
      silent: false
    });

    if (event.status === 'done' && event.outputPath) {
      const outputPath = event.outputPath;
      notification.on('click', () => {
        shell.showItemInFolder(outputPath);
      });
    }

    notification.show();
  } catch (error) {
    logger.warn('Failed to show desktop notification', {
      status: event.status,
      jobId: event.jobId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
