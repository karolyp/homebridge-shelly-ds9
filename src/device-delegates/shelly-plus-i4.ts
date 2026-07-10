import { Device, Input, ShellyPlusI4, ShellyPlusI4V3 } from "shellies-ds9";

import { DeviceDelegate } from "./base";
import { InputOptions } from "../config";
import {
  DoorbellAbility,
  ReadonlySwitchAbility,
  ServiceLabelAbility,
  StatelessProgrammableSwitchAbility,
} from "../abilities";

type InputMode = "excluded" | "button" | "switch" | "doorbell";

/**
 * Handles Shelly Plus I4 devices.
 */
export class ShellyPlusI4Delegate extends DeviceDelegate {
  protected setup() {
    const d = this.device as ShellyPlusI4;
    const inputs = [d.input0, d.input1, d.input2, d.input3];

    // resolve how each input should be represented, using the plugin config if set
    // and falling back to the input type configured on the Shelly device
    const modes = inputs.map((input) => this.resolveInputMode(input));

    // create a doorbell accessory for each input (only active when configured as one)
    inputs.forEach((input, i) => {
      this.createAccessory(
        `doorbell${i}`,
        null,
        new DoorbellAbility(input)
      ).setActive(modes[i] === "doorbell");
    });

    // create a single accessory grouping all button inputs
    this.createAccessory(
      "buttons",
      null,
      new StatelessProgrammableSwitchAbility(d.input0).setActive(
        modes[0] === "button"
      ),
      new StatelessProgrammableSwitchAbility(d.input1).setActive(
        modes[1] === "button"
      ),
      new StatelessProgrammableSwitchAbility(d.input2).setActive(
        modes[2] === "button"
      ),
      new StatelessProgrammableSwitchAbility(d.input3).setActive(
        modes[3] === "button"
      ),
      new ServiceLabelAbility()
    ).setActive(modes.some((m) => m === "button"));

    // create accessories for all switch inputs
    inputs.forEach((input, i) => {
      this.createAccessory(
        `switch${i}`,
        null,
        new ReadonlySwitchAbility(input)
      ).setActive(modes[i] === "switch");
    });
  }

  /**
   * Determines how the given input should be represented in HomeKit.
   */
  protected resolveInputMode(input: Input): InputMode {
    const opts = this.getComponentOptions<InputOptions>(input) ?? {};

    if (opts.exclude) {
      return "excluded";
    }
    if (opts.type) {
      return opts.type;
    }

    return input.config?.type === "button" ? "button" : "switch";
  }
}

/**
 * Shelly Plus i4 DC — identical to the AC Plus i4 (4 inputs, no relays),
 * only the model code differs. Not defined in shellies-ds9@1.1.9, so we
 * register it here.
 */
export class ShellyPlusI4Dc extends ShellyPlusI4 {
  static readonly model: string = "SNSN-0D24X";
  static readonly modelName: string = "Shelly Plus I4 DC";
}

Device.registerClass(ShellyPlusI4Dc);

DeviceDelegate.registerDelegate(
  ShellyPlusI4Delegate,
  ShellyPlusI4,
  ShellyPlusI4V3,
  ShellyPlusI4Dc
);
