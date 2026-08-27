export interface AddressModel {
  readonly id: string;
  readonly label: string;
  readonly province: string;
  readonly city: string;
  readonly fullAddress: string;
  readonly postalCode?: string;
  readonly phone: string;
  readonly isDefault: boolean;
}

export interface AddressPayloadModel {
  readonly label: string;
  readonly province: string;
  readonly city: string;
  readonly fullAddress: string;
  readonly postalCode?: string;
  readonly phone: string;
  readonly isDefault?: boolean;
}
