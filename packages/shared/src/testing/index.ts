/**
 * Entry point for @epde/shared/testing. Tree-shaken out of production bundles
 * because nothing in src/index.ts exports from here.
 *
 * Import as:
 *   import { makeTask, makeUser } from '@epde/shared/testing';
 */
export * from './factories';
