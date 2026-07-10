import { Input } from 'shellies-ds9';

import { Ability, ServiceClass } from './base';

/**
 * Represents a Shelly input as a HomeKit Doorbell.
 * A single push on the input triggers a doorbell event, which HomeKit turns into
 * a rich push notification on all iPhones in the home.
 *
 * Note: the input must be configured as type `button` on the Shelly device for it
 * to emit push events.
 */
export class DoorbellAbility extends Ability {
  /**
   * @param component - The input component to use.
   */
  constructor(readonly component: Input) {
    super(`Doorbell ${component.id + 1}`, `doorbell-${component.id}`);
  }

  protected get serviceClass(): ServiceClass {
    return this.Service.Doorbell;
  }

  protected initialize() {
    // mark this as the primary service and flag the accessory as a doorbell so that
    // HomeKit treats it as one and delivers doorbell notifications
    this.service.setPrimaryService(true);
    this.platformAccessory.category = this.api.hap.Categories.VIDEO_DOORBELL;

    // ring the doorbell on a single push
    this.component.on('singlePush', this.singlePushHandler, this);
  }

  detach() {
    this.component.off('singlePush', this.singlePushHandler, this);
  }

  /**
   * Handles 'singlePush' events from our input component.
   */
  protected singlePushHandler() {
    this.log.debug(`Input ${this.component.id}: doorbell press`);

    const PSE = this.Characteristic.ProgrammableSwitchEvent;
    this.service.getCharacteristic(PSE).updateValue(PSE.SINGLE_PRESS);
  }
}
