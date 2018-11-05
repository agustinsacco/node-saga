import { expect } from 'chai';
import { Transaction } from '../lib/Transaction';

describe('Transaction', () => {

    describe('Constructor Validation', () => {
        it('Should throw error when name property is missing', async () => {
            expect(() => new Transaction({
                action: () => () => { return null; },
                rollback: intendedId => (intendedId) => { return null; },
                identifier: 'id',
            })).to.throw(Error, 'name property is required');
        });

        it('Should throw error when name property is not type string', async () => {
            expect(() => new Transaction({
                name: 234,
                action: () => () => { return null; },
                rollback: intendedId => (intendedId) => { return null; },
                identifier: 'id',
            })).to.throw(Error, 'name property must be of type "string"');
        });

        it('Should throw error when action property is missing', async () => {
            expect(() => new Transaction({
                name: 'test',
                rollback: intendedId => (intendedId) => { return null; },
                identifier: 'id',
            })).to.throw(Error, 'action property is required');
        });

        it('Should throw error when action property is not a function', async () => {
            expect(() => new Transaction({
                name: 'test',
                action: 'test',
                rollback: intendedId => (intendedId) => { return null; },
                identifier: 'id',
            })).to.throw(Error, 'action property must be a function');
        });

        it('Should throw error when rollback property is missing', async () => {
            expect(() => new Transaction({
                name: 'test',
                action: () => () => { return null; },
                identifier: 'id',
            })).to.throw(Error, 'rollback property is required');
        });

        it('Should throw error when rollback property is not a function', async () => {
            expect(() => new Transaction({
                name: 'test',
                action: () => () => { return null; },
                rollback: 'test',
                identifier: 'id',
            })).to.throw(Error, 'rollback property must be a function');
        });
    });

});
