import type {CustomerAddressInput} from '@shopify/hydrogen/customer-account-api-types';
import type {
  AddressFragment,
  CustomerFragment,
} from 'customer-accountapi.generated';
import {useEffect, useRef, useState, type RefObject} from 'react';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
} from 'react-router';
import type {Route} from './+types/account.addresses';
import {
  UPDATE_ADDRESS_MUTATION,
  DELETE_ADDRESS_MUTATION,
  CREATE_ADDRESS_MUTATION,
} from '~/graphql/customer-account/CustomerAddressMutations';

const NEW_ADDRESS_ID = 'NEW_ADDRESS_ID';
const PRIVATE_HEADERS = {'Cache-Control': 'no-store'};
const ADDRESS_FIELDS = [
  'firstName',
  'lastName',
  'company',
  'address1',
  'address2',
  'city',
  'zoneCode',
  'zip',
  'territoryCode',
  'phoneNumber',
] as const satisfies ReadonlyArray<keyof CustomerAddressInput>;
const REQUIRED_ADDRESS_FIELDS = [
  'firstName',
  'lastName',
  'address1',
  'city',
  'zoneCode',
  'zip',
  'territoryCode',
] as const;

type AddressFieldName = (typeof ADDRESS_FIELDS)[number];
type ActionError = Record<string, string> | string | null;

export type ActionResponse = {
  addressId?: string | null;
  createdAddress?: Pick<AddressFragment, 'id'>;
  deletedAddress?: string | null;
  error: ActionError;
  fieldErrors?: Record<string, string>;
  success?: 'created' | 'updated' | 'deleted';
  updatedAddress?: Pick<AddressFragment, 'id'>;
};

type AddressUserError = {
  field?: readonly (string | null)[] | null;
  message: string;
};

type AddressFieldConfig = {
  autoComplete: string;
  label: string;
  name: AddressFieldName;
  placeholder: string;
  type?: 'tel' | 'text';
  wide?: boolean;
};

const ADDRESS_FIELD_CONFIG: ReadonlyArray<AddressFieldConfig> = [
  {
    name: 'firstName',
    label: 'First name',
    autoComplete: 'given-name',
    placeholder: 'First name',
  },
  {
    name: 'lastName',
    label: 'Last name',
    autoComplete: 'family-name',
    placeholder: 'Last name',
  },
  {
    name: 'company',
    label: 'Company',
    autoComplete: 'organization',
    placeholder: 'Company',
  },
  {
    name: 'address1',
    label: 'Address line 1',
    autoComplete: 'address-line1',
    placeholder: 'Street address',
    wide: true,
  },
  {
    name: 'address2',
    label: 'Address line 2',
    autoComplete: 'address-line2',
    placeholder: 'Apartment, suite, or unit',
    wide: true,
  },
  {
    name: 'city',
    label: 'City',
    autoComplete: 'address-level2',
    placeholder: 'City',
  },
  {
    name: 'zoneCode',
    label: 'State / Province',
    autoComplete: 'address-level1',
    placeholder: 'State or province',
  },
  {
    name: 'zip',
    label: 'Postal code',
    autoComplete: 'postal-code',
    placeholder: 'Postal code',
  },
  {
    name: 'territoryCode',
    label: 'Country code',
    autoComplete: 'country',
    placeholder: 'PK',
  },
  {
    name: 'phoneNumber',
    label: 'Phone number',
    autoComplete: 'tel',
    placeholder: '+92 300 1234567',
    type: 'tel',
  },
];

const EMPTY_ADDRESS: CustomerAddressInput = {
  address1: '',
  address2: '',
  city: '',
  company: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  territoryCode: '',
  zoneCode: '',
  zip: '',
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Addresses'}];
};

export async function loader({context}: Route.LoaderArgs) {
  await context.customerAccount.handleAuthStatus();

  return {};
}

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount} = context;
  const method = request.method.toUpperCase();

  if (!['POST', 'PUT', 'DELETE'].includes(method)) {
    return data(
      {addressId: null, error: 'Method not allowed', fieldErrors: {}},
      {status: 405, headers: PRIVATE_HEADERS},
    );
  }

  try {
    const form = await request.formData();
    const submittedAddressId = getAddressId(form);

    if (method !== 'POST' && !submittedAddressId) {
      return data(
        {
          addressId: null,
          error: 'We could not identify this address. Please try again.',
          fieldErrors: {},
        },
        {status: 400, headers: PRIVATE_HEADERS},
      );
    }
    const addressId = submittedAddressId ?? NEW_ADDRESS_ID;

    const isLoggedIn = await customerAccount.isLoggedIn();
    if (!isLoggedIn) {
      return addressErrorResponse(addressId, 'Unauthorized', {}, 401);
    }

    const decodedAddressId = decodeAddressId(addressId);
    if (!decodedAddressId) {
      return addressErrorResponse(
        addressId,
        'We could not identify this address. Please try again.',
      );
    }

    const address = getAddressInput(form);
    const defaultAddress = form.get('defaultAddress') === 'on';
    const language = customerAccount.i18n.language;

    switch (method) {
      case 'POST': {
        const response = await customerAccount.mutate(CREATE_ADDRESS_MUTATION, {
          variables: {address, defaultAddress, language},
        });
        const payload = response.data?.customerAddressCreate;

        if (response.errors?.length) {
          return addressErrorResponse(
            addressId,
            'We could not save your address. Please review your details and try again.',
          );
        }
        if (payload?.userErrors?.length) {
          return addressErrorResponse(
            addressId,
            getUserErrorMessage(payload.userErrors),
            getFieldErrors(payload.userErrors),
          );
        }
        if (!payload?.customerAddress) {
          return addressErrorResponse(
            addressId,
            'We could not save your address. Please try again.',
          );
        }

        return data<ActionResponse>(
          {
            addressId,
            createdAddress: payload.customerAddress,
            error: null,
            fieldErrors: {},
            success: 'created',
          },
          {headers: PRIVATE_HEADERS},
        );
      }

      case 'PUT': {
        const response = await customerAccount.mutate(UPDATE_ADDRESS_MUTATION, {
          variables: {
            address,
            addressId: decodedAddressId,
            defaultAddress,
            language,
          },
        });
        const payload = response.data?.customerAddressUpdate;

        if (response.errors?.length) {
          return addressErrorResponse(
            addressId,
            'We could not update your address. Please review your details and try again.',
          );
        }
        if (payload?.userErrors?.length) {
          return addressErrorResponse(
            addressId,
            getUserErrorMessage(payload.userErrors),
            getFieldErrors(payload.userErrors),
          );
        }
        if (!payload?.customerAddress) {
          return addressErrorResponse(
            addressId,
            'We could not update your address. Please try again.',
          );
        }

        return data<ActionResponse>(
          {
            addressId,
            error: null,
            fieldErrors: {},
            success: 'updated',
            updatedAddress: payload.customerAddress,
          },
          {headers: PRIVATE_HEADERS},
        );
      }

      case 'DELETE': {
        const response = await customerAccount.mutate(DELETE_ADDRESS_MUTATION, {
          variables: {addressId: decodedAddressId, language},
        });
        const payload = response.data?.customerAddressDelete;

        if (response.errors?.length) {
          return addressErrorResponse(
            addressId,
            'We could not remove this address. Please try again.',
          );
        }
        if (payload?.userErrors?.length) {
          return addressErrorResponse(
            addressId,
            getUserErrorMessage(payload.userErrors),
          );
        }
        if (!payload?.deletedAddressId) {
          return addressErrorResponse(
            addressId,
            'We could not remove this address. Please try again.',
          );
        }

        return data<ActionResponse>(
          {
            addressId,
            deletedAddress: addressId,
            error: null,
            fieldErrors: {},
            success: 'deleted',
          },
          {headers: PRIVATE_HEADERS},
        );
      }

      default:
        return data(
          {addressId, error: 'Method not allowed', fieldErrors: {}},
          {status: 405, headers: PRIVATE_HEADERS},
        );
    }
  } catch {
    return data(
      {
        addressId: null,
        error: 'We could not process that address request. Please try again.',
        fieldErrors: {},
      },
      {status: 400, headers: PRIVATE_HEADERS},
    );
  }
}

export default function Addresses() {
  const {customer} = useOutletContext<{customer: CustomerFragment}>();
  const action = useActionData<ActionResponse>();
  const navigation = useNavigation();
  const {defaultAddress, addresses} = customer;
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [dismissedAction, setDismissedAction] = useState<
    ActionResponse | undefined
  >();
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const previousAction = useRef<ActionResponse>();
  const formHeadingRef = useRef<HTMLLegendElement>(null);

  useEffect(() => {
    if (!activeForm) return;

    const frame = requestAnimationFrame(() => formHeadingRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [activeForm]);

  useEffect(() => {
    if (
      !action ||
      action === previousAction.current ||
      navigation.state !== 'idle'
    )
      return;
    previousAction.current = action;

    if (action.error) {
      if (
        action.addressId === activeForm ||
        action.addressId === confirmingId
      ) {
        const frame = requestAnimationFrame(() => feedbackRef.current?.focus());
        return () => cancelAnimationFrame(frame);
      }
      return;
    }

    if (action.success === 'deleted') {
      setConfirmingId(null);
    } else if (action.success === 'created' || action.success === 'updated') {
      setActiveForm(null);
    }
  }, [action, activeForm, confirmingId, navigation.state]);

  const openAddForm = () => {
    setDismissedAction(action);
    setConfirmingId(null);
    setActiveForm(NEW_ADDRESS_ID);
  };
  const openEditForm = (addressId: string) => {
    setDismissedAction(action);
    setConfirmingId(null);
    setActiveForm(addressId);
  };
  const openRemoveConfirmation = (addressId: string) => {
    setDismissedAction(action);
    setConfirmingId(addressId);
  };
  const closeForm = () => setActiveForm(null);
  const visibleAction = action === dismissedAction ? undefined : action;
  const pageError =
    typeof visibleAction?.error === 'string' ? visibleAction.error : null;
  const activeAddress = addresses.nodes.find(
    (address) => address.id === activeForm,
  );

  return (
    <section aria-labelledby="addresses-heading" className="account-addresses">
      <header className="account-addresses-header">
        <div>
          <p className="account-eyebrow">Your saved details</p>
          <h1 id="addresses-heading">Addresses</h1>
        </div>
        {addresses.nodes.length > 0 && !activeForm ? (
          <button
            className="account-addresses-add"
            onClick={openAddForm}
            type="button"
          >
            + Add new address
          </button>
        ) : null}
      </header>

      {pageError ? (
        <p className="account-addresses-form-error" role="alert" tabIndex={-1}>
          {pageError}
        </p>
      ) : null}

      {activeForm && (activeForm === NEW_ADDRESS_ID || activeAddress) ? (
        <AddressForm
          addressId={activeForm}
          address={activeAddress ?? EMPTY_ADDRESS}
          defaultAddressId={defaultAddress?.id}
          error={getActionError(visibleAction, activeForm)}
          fieldErrors={
            visibleAction?.addressId === activeForm
              ? visibleAction.fieldErrors
              : undefined
          }
          feedbackRef={feedbackRef}
          headingRef={formHeadingRef}
          mode={activeForm === NEW_ADDRESS_ID ? 'create' : 'edit'}
          onCancel={closeForm}
        />
      ) : null}

      {addresses.nodes.length ? (
        <ul className="account-address-list">
          {addresses.nodes.map((address, index) => (
            <li key={address.id}>
              <AddressCard
                action={visibleAction}
                address={address}
                defaultAddressId={defaultAddress?.id}
                feedbackRef={feedbackRef}
                index={index}
                isConfirming={confirmingId === address.id}
                onCancelRemove={() => setConfirmingId(null)}
                onEdit={() => openEditForm(address.id)}
                onRemove={() => openRemoveConfirmation(address.id)}
              />
            </li>
          ))}
        </ul>
      ) : activeForm ? null : (
        <div className="account-address-empty">
          <h2>No saved addresses</h2>
          <p>Add an address to speed up checkout next time.</p>
          <button onClick={openAddForm} type="button">
            Add address
          </button>
        </div>
      )}
    </section>
  );
}

function AddressForm({
  address,
  addressId,
  defaultAddressId,
  error,
  fieldErrors,
  feedbackRef,
  headingRef,
  mode,
  onCancel,
}: {
  address: CustomerAddressInput;
  addressId: string;
  defaultAddressId?: string | null;
  error?: string | null;
  fieldErrors?: Record<string, string>;
  feedbackRef: RefObject<HTMLParagraphElement>;
  headingRef: RefObject<HTMLLegendElement>;
  mode: 'create' | 'edit';
  onCancel: () => void;
}) {
  const navigation = useNavigation();
  const formId = getAddressFormId(addressId);
  const isSubmitting =
    navigation.state !== 'idle' &&
    navigation.formData?.get('addressId') === addressId;

  return (
    <Form className="account-addresses-form" id={formId} method="post">
      <fieldset>
        <input name="addressId" type="hidden" value={addressId} />
        <legend ref={headingRef} tabIndex={-1}>
          {mode === 'create' ? 'Add new address' : 'Edit address'}
        </legend>
        <div className="account-address-fields">
          {ADDRESS_FIELD_CONFIG.map((field) => {
            const fieldId = `${formId}-${field.name}`;
            const fieldError = fieldErrors?.[field.name];
            const isRequired = REQUIRED_ADDRESS_FIELDS.includes(
              field.name as (typeof REQUIRED_ADDRESS_FIELDS)[number],
            );

            return (
              <div
                className={
                  field.wide
                    ? 'account-address-field account-address-field-wide'
                    : 'account-address-field'
                }
                key={field.name}
              >
                <label htmlFor={fieldId}>
                  {field.label}
                  {isRequired ? ' *' : ''}
                </label>
                <input
                  aria-describedby={fieldError ? `${fieldId}-error` : undefined}
                  aria-invalid={fieldError ? true : undefined}
                  autoComplete={field.autoComplete}
                  defaultValue={getAddressValue(address, field.name)}
                  id={fieldId}
                  maxLength={field.name === 'territoryCode' ? 3 : undefined}
                  name={field.name}
                  pattern={
                    field.name === 'phoneNumber'
                      ? '^\\+?[1-9]\\d{3,14}$'
                      : undefined
                  }
                  placeholder={field.placeholder}
                  required={isRequired}
                  type={field.type ?? 'text'}
                />
                {fieldError ? (
                  <p
                    className="account-address-field-error"
                    id={`${fieldId}-error`}
                  >
                    {fieldError}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="account-address-checkbox">
          <input
            defaultChecked={defaultAddressId === addressId}
            id={`${formId}-defaultAddress`}
            name="defaultAddress"
            type="checkbox"
          />
          <label htmlFor={`${formId}-defaultAddress`}>
            Set as default address
          </label>
        </div>
        {error ? (
          <p
            aria-live="assertive"
            className="account-addresses-form-error"
            ref={feedbackRef}
            role="alert"
            tabIndex={-1}
          >
            {error}
          </p>
        ) : null}
        <div className="account-addresses-form-actions">
          <button
            disabled={isSubmitting}
            formMethod={mode === 'create' ? 'POST' : 'PUT'}
            type="submit"
          >
            {isSubmitting
              ? mode === 'create'
                ? 'Saving address'
                : 'Saving changes'
              : 'Save address'}
          </button>
          <button disabled={isSubmitting} onClick={onCancel} type="button">
            Cancel
          </button>
        </div>
      </fieldset>
    </Form>
  );
}

function AddressCard({
  action,
  address,
  defaultAddressId,
  feedbackRef,
  index,
  isConfirming,
  onCancelRemove,
  onEdit,
  onRemove,
}: {
  action?: ActionResponse;
  address: AddressFragment;
  defaultAddressId?: string | null;
  feedbackRef: RefObject<HTMLParagraphElement>;
  index: number;
  isConfirming: boolean;
  onCancelRemove: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const navigation = useNavigation();
  const removeButtonRef = useRef<HTMLButtonElement>(null);
  const confirmationRef = useRef<HTMLParagraphElement>(null);
  const isDefault = address.id === defaultAddressId;
  const error = getActionError(action, address.id);
  const isDeleting =
    navigation.state !== 'idle' &&
    navigation.formMethod === 'DELETE' &&
    navigation.formData?.get('addressId') === address.id;

  useEffect(() => {
    if (!isConfirming) return;

    const frame = requestAnimationFrame(() => confirmationRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isConfirming]);

  const cancelRemove = () => {
    onCancelRemove();
    requestAnimationFrame(() => removeButtonRef.current?.focus());
  };

  return (
    <article
      aria-labelledby={`address-card-${index + 1}`}
      className="account-address-card"
    >
      <div className="account-address-card-header">
        <h2 id={`address-card-${index + 1}`}>Saved address {index + 1}</h2>
        {isDefault ? (
          <span className="account-address-default">Default</span>
        ) : null}
      </div>
      <address className="account-address-details">
        {getFormattedAddressLines(address).map((line) => (
          <span key={`${address.id}-${line}`}>{line}</span>
        ))}
        {address.phoneNumber ? (
          <a href={`tel:${encodeURIComponent(address.phoneNumber)}`}>
            {address.phoneNumber}
          </a>
        ) : (
          <span className="account-address-phone-empty">
            No phone number provided
          </span>
        )}
      </address>

      {isConfirming ? (
        <div
          aria-describedby={`remove-address-${index + 1}-message`}
          aria-labelledby={`address-card-${index + 1}`}
          className="account-address-confirmation"
          role="alertdialog"
        >
          <p
            id={`remove-address-${index + 1}-message`}
            ref={confirmationRef}
            tabIndex={-1}
          >
            Remove this saved address? This cannot be undone.
          </p>
          {error ? (
            <p
              aria-live="assertive"
              className="account-address-card-error"
              ref={feedbackRef}
              role="alert"
              tabIndex={-1}
            >
              {error}
            </p>
          ) : null}
          <div className="account-address-confirm-actions">
            <button disabled={isDeleting} onClick={cancelRemove} type="button">
              Cancel
            </button>
            <Form method="post">
              <input name="addressId" type="hidden" value={address.id} />
              <button disabled={isDeleting} formMethod="DELETE" type="submit">
                {isDeleting ? 'Removing address' : 'Confirm remove'}
              </button>
            </Form>
          </div>
        </div>
      ) : (
        <div className="account-address-actions">
          <button
            aria-label={`Edit saved address ${index + 1}`}
            onClick={onEdit}
            type="button"
          >
            Edit
          </button>
          <button
            aria-label={`Remove saved address ${index + 1}`}
            className="account-address-remove"
            onClick={onRemove}
            ref={removeButtonRef}
            type="button"
          >
            Remove
          </button>
        </div>
      )}
    </article>
  );
}

function getAddressId(form: FormData) {
  const value = form.get('addressId');
  if (typeof value !== 'string' || !value || value.length > 2048) return null;
  return value;
}

function decodeAddressId(addressId: string) {
  try {
    return decodeURIComponent(addressId);
  } catch {
    return null;
  }
}

function getAddressInput(form: FormData): CustomerAddressInput {
  const address: CustomerAddressInput = {};

  for (const field of ADDRESS_FIELDS) {
    const value = form.get(field);
    if (typeof value === 'string') address[field] = value.trim();
  }

  return address;
}

function getAddressValue(
  address: CustomerAddressInput,
  field: AddressFieldName,
) {
  const value = address[field];
  return typeof value === 'string' ? value : '';
}

function getAddressFormId(addressId: string) {
  const safeId =
    addressId === NEW_ADDRESS_ID
      ? 'new'
      : addressId.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `address-form-${safeId}`;
}

function getFormattedAddressLines(address: AddressFragment) {
  const formatted = address.formatted.filter(Boolean);
  if (formatted.length) return formatted;

  return [
    [address.firstName, address.lastName].filter(Boolean).join(' '),
    address.company,
    address.address1,
    address.address2,
    [address.city, address.zoneCode, address.zip].filter(Boolean).join(', '),
    address.territoryCode,
  ].filter((line): line is string => Boolean(line));
}

function getActionError(action: ActionResponse | undefined, addressId: string) {
  if (!action?.error) return null;
  if (typeof action.error === 'string') return action.error;
  return action.error[addressId] ?? null;
}

function getUserErrorMessage(userErrors: readonly AddressUserError[]) {
  return (
    userErrors.find((userError) => userError.message.trim())?.message ??
    'Please review the address details and try again.'
  );
}

function getFieldErrors(userErrors: readonly AddressUserError[]) {
  return Object.fromEntries(
    userErrors.flatMap((userError) => {
      const field = userError.field?.[userError.field.length - 1];
      if (
        typeof field !== 'string' ||
        !ADDRESS_FIELDS.includes(field as AddressFieldName)
      ) {
        return [];
      }
      return [[field, userError.message]];
    }),
  ) as Record<string, string>;
}

function addressErrorResponse(
  addressId: string,
  error: string,
  fieldErrors: Record<string, string> = {},
  status = 400,
) {
  return data<ActionResponse>(
    {
      addressId,
      error: {[addressId]: error},
      fieldErrors,
    },
    {status, headers: PRIVATE_HEADERS},
  );
}
