import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactElement } from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';

import { defaultEventFormValues } from '@/services/events/event-form';
import type { EventFormValues } from '@/services/events/event-submission.types';

import { EventFormProvider, type EventFormContextValue } from './EventFormContext';

/** Form values for tests: the defaults in Europe/Lisbon, with overrides. */
export function eventFormValues(over: Partial<EventFormValues> = {}): EventFormValues {
  return { ...defaultEventFormValues('Europe/Lisbon'), ...over };
}

interface RenderSectionOptions extends Partial<EventFormContextValue> {
  values?: Partial<EventFormValues>;
}

/**
 * Renders one form section inside the form's own providers, for tests. `form.current` is the react-hook-form
 * instance, to read values with `getValues()` and to set messages with `setError()`.
 */
export function renderSection(ui: ReactElement, { values, ...context }: RenderSectionOptions = {}) {
  const form: { current: UseFormReturn<EventFormValues> | null } = { current: null };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  function Harness() {
    const methods = useForm<EventFormValues>({ defaultValues: eventFormValues(values) });
    useEffect(() => {
      form.current = methods;
    });
    return (
      <QueryClientProvider client={queryClient}>
        <FormProvider {...methods}>
          <EventFormProvider value={{ variant: 'submit', signedIn: true, busy: false, ...context }}>
            {ui}
          </EventFormProvider>
        </FormProvider>
      </QueryClientProvider>
    );
  }

  const view = render(<Harness />);
  return { ...view, form: form as { current: UseFormReturn<EventFormValues> } };
}
