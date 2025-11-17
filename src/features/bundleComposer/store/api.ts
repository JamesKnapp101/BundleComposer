import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Bundle } from '../../../schema';

export const storeApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Bundle', 'Bundles'],
  endpoints: (b) => ({
    getBundles: b.query<Bundle[], void>({
      query: () => '/bundles',
      providesTags: (res: Bundle[] | undefined) =>
        res
          ? [
              { type: 'Bundles', id: 'LIST' },
              ...res.map((x) => ({ type: 'Bundle' as const, id: (x as Bundle).id })),
            ]
          : [{ type: 'Bundles', id: 'LIST' }],
    }),
    getBundle: b.query<Bundle, string>({
      query: (id: string) => `/bundles/${id}`,
      providesTags: (res: Bundle | undefined) =>
        res ? [{ type: 'Bundle', id: (res as Bundle).id }] : [],
    }),
    upsertBundle: b.mutation<Bundle, Partial<Bundle> & { id?: string }>({
      query: (body: Partial<Bundle> & { id?: string }) => ({
        url: body.id ? `/bundles/${body.id}` : '/bundles',
        method: body.id ? 'PUT' : 'POST',
        body,
      }),
      invalidatesTags: (res: Bundle | undefined) =>
        res
          ? [
              { type: 'Bundle', id: (res as Bundle).id },
              { type: 'Bundles', id: 'LIST' },
            ]
          : [{ type: 'Bundles', id: 'LIST' }],
    }),
  }),
});
export const { useGetBundlesQuery, useGetBundleQuery, useUpsertBundleMutation } = storeApi;
