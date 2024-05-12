import { Static, Type } from '@sinclair/typebox';

export const LandingEvent = Type.Object({
  id: Type.Optional(Type.String()),
  date: Type.String(),
  registration: Type.String(),
  model: Type.String(),
  pilotInCommand: Type.String(),
  firstOfficer: Type.Optional(Type.String()),
  paxNumber: Type.Number({ default: 0 }),
  departure: Type.String(),
  destination: Type.String(),
  arrivalTime: Type.String(),
  departureTime: Type.String()
});

export type LandingEventType = Static<typeof LandingEvent>;

export const HttpError = Type.Object({
  statusCode: Type.Number(),
  code: Type.String(),
  error: Type.String(),
  message: Type.String(),
  time: Type.Optional(Type.String())
});

export type HttpErrorType = Static<typeof HttpError>;
