/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
    "/rooms/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Rooms */
        get: operations["rooms_rooms"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bookings/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Bookings */
        get: operations["bookings_bookings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** Booking */
        Booking: {
            /** Room Id */
            room_id: string;
            /** Title */
            title: string;
            /**
             * Start
             * Format: date-time
             */
            start: string;
            /**
             * End
             * Format: date-time
             */
            end: string;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /**
         * Room
         * @description Room description.
         */
        Room: {
            /**
             * Id
             * @description Room slug
             */
            id: string;
            /**
             * Title
             * @description Room title
             */
            title: string;
            /**
             * Short Name
             * @description Shorter version of room title
             */
            short_name: string;
            /**
             * My Uni Id
             * @description ID of room on My University portal
             */
            my_uni_id: number;
            /**
             * Capacity
             * @description Room capacity, amount of people
             */
            capacity?: number | null;
            /**
             * Access Level
             * @description Access level to the room. Yellow = for students. Red = for employees. Special = special rules apply.
             */
            access_level?: ("yellow" | "red" | "special") | null;
            /**
             * Restrict Daytime
             * @description Prohibit to book during working hours. True = this room is available only at night 19:00-8:00, or full day on weekends.
             * @default false
             */
            restrict_daytime: boolean;
        };
        /** ValidationError */
        ValidationError: {
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    rooms_rooms: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Room"][];
                };
            };
        };
    };
    bookings_bookings: {
        parameters: {
            query: {
                /** @example 2024-10-12T19:45+00:00 */
                start: string;
                /** @example 2024-10-13T04:45+00:00 */
                end: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Booking"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
}
