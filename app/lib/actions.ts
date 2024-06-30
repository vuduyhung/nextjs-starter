'use server';

import { custom, z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
  customerName: z.string({
    invalid_type_error: 'Please enter a customer name.',
  }),
  customerEmail: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  customerImageUrl: z
    .string()
    .regex(/^(\/[\w-]+)+\.(png|jpg|jpeg|gif|svg)$/i, {
      message: 'Please enter a valid URL or leave it empty.',
    })
    // .url({
    //   message: 'Please enter a valid URL.',
    // })
    .or(z.literal('')), // Allow empty string
});

const CreateInvoice = FormSchema.omit({ id: true, date: true, customerName: true, customerEmail: true, customerImageUrl: true});
const UpdateInvoice = FormSchema.omit({ id: true, date: true, customerName: true, customerEmail: true, customerImageUrl: true});
const CreateCustomer = FormSchema.omit({
  id: true,
  customerId: true,
  amount: true,
  status: true,
  date: true,
});
const UpdateCustomer = FormSchema.omit({
  id: true,
  customerId: true,
  amount: true,
  status: true,
  date: true,
});

export type State = {
  errors?: {
    customerId?: string[];
    customerName?: string[];
    customerEmail?: string[];
    customerImageUrl?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

//#region "Invoices"
export async function createInvoice(prevState: State, formData: FormData) {
  // const rawFormData = Object.fromEntries(formData.entries());
  // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }


  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  // Revalidate the cache for the invoices page and redirect the user
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  // Validate form fields using Zod
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;

  const amountInCents = amount * 100;

  try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
        `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  // throw new Error('Failed to Delete Invoice');

  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return { message: 'Deleted Invoice.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
}
//#endregion

//#region "Customers"
export async function createCustomer(prevState: State, formData: FormData) {
  // Validate form fields using Zod
  const validatedFields = CreateCustomer.safeParse({
    customerName: formData.get('name'),
    customerEmail: formData.get('email'),
    customerImageUrl: formData.get('image_url'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Customer.',
    };
  }

  // Prepare data for insertion into the database
  const { customerName, customerEmail, customerImageUrl } =
    validatedFields.data;

  // const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
            INSERT INTO customers (name, email, image_url)
            VALUES (${customerName}, ${customerEmail}, ${customerImageUrl})
        `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Customer.',
    };
  }

  // Revalidate the cache for the customers page and redirect the user
  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

export async function updateCustomer(
  id: string,
  prevState: State,
  formData: FormData,
) {
  console.log('formData', formData);
  // Validate form fields using Zod
  const validatedFields = UpdateCustomer.safeParse({
    customerName: formData.get('name'),
    customerEmail: formData.get('email'),
    customerImageUrl: formData.get('image_url'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Customer.',
    };
  }

  // Prepare data for insertion into the database
  const { customerName, customerEmail, customerImageUrl } =
    validatedFields.data;

  try {
    await sql`
          UPDATE customers
          SET name = ${customerName}, email = ${customerEmail}, image_url = ${customerImageUrl}
          WHERE id = ${id}
          `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Customer.' };
  }

  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

export async function deleteCustomer(id: string) {
  try {
    await sql`DELETE FROM customers WHERE id = ${id}`;
    revalidatePath('/dashboard/customers');
    return { message: 'Deleted Customer.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Customer.' };
  }
}
//#endregion
