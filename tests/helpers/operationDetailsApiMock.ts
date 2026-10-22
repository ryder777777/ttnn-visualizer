// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileCopyrightText: © 2026 Tenstorrent AI ULC

import { NumberRange } from '@blueprintjs/core';
import { QueryStatus } from '@tanstack/react-query';
import { OperationDescription, OperationDetailsData, Tensor } from '../../src/model/APIData';
import { TensorDeallocationReport } from '../../src/model/BufferSummary';
import {
    FIXTURE_L1_SIZE,
    buildOperationDescription,
    buildOperationDetailsData,
} from './operationDetailsFixtures';

export interface OperationDetailsUseApiMockOptions {
    operations?: () => OperationDescription[];
    tensors?: () => Tensor[];
    operationDetails?: (operationId: number) => Partial<OperationDetailsData>;
    previousOperationDetails?: (operationId: number) => {
        data: OperationDetailsData | undefined;
        isLoading: boolean;
    };
    deallocationReport?: () => {
        lateDeallocationsByOperation?: Map<number, TensorDeallocationReport[]>;
        nonDeallocatedTensorList?: Map<number, TensorDeallocationReport[]>;
        status?: QueryStatus;
        operationRange?: NumberRange | null;
    };
}

const defaultOperations = (): OperationDescription[] => [
    buildOperationDescription({ id: 0, name: 'op' }),
    buildOperationDescription({ id: 1, name: 'op' }),
    buildOperationDescription({ id: 2, name: 'op' }),
];

/**
 * Shared `useAPI` module mock for `OperationDetailsComponent` specs so the hook
 * surface (`useGetClusterDescription`, markers, deallocation report defaults)
 * stays in step while each spec overrides only the slice it exercises.
 */
export function operationDetailsUseApiMock(options: OperationDetailsUseApiMockOptions = {}) {
    return {
        useGetClusterDescription: () => ({ data: undefined }),
        useOperationsList: () => ({
            data: options.operations ? options.operations() : defaultOperations(),
        }),
        useGetL1StartMarker: () => 0,
        useGetL1SmallMarker: () => FIXTURE_L1_SIZE,
        useTensors: () => ({ data: options.tensors ? options.tensors() : [] }),
        useOperationDetails: (operationId: number) => ({
            operationDetails: {
                data: buildOperationDetailsData({
                    id: operationId,
                    ...(options.operationDetails ? options.operationDetails(operationId) : {}),
                }),
                isLoading: false,
                status: 'success' as const,
            },
        }),
        usePreviousOperationDetails: (operationId: number) => ({
            operationDetails: options.previousOperationDetails
                ? options.previousOperationDetails(operationId)
                : {
                      data: buildOperationDetailsData({ id: operationId - 1 }),
                      isLoading: false,
                  },
        }),
        useGetTensorDeallocationReportByOperation: () => {
            const report = options.deallocationReport ? options.deallocationReport() : {};

            return {
                lateDeallocationsByOperation: report.lateDeallocationsByOperation ?? new Map(),
                nonDeallocatedTensorList: report.nonDeallocatedTensorList ?? new Map(),
                status: report.status ?? ('success' as QueryStatus),
                operationRange: report.operationRange ?? null,
            };
        },
    };
}
