'use strict';

const flow = require('../lib/flow.js');
const sinon = require('sinon');
const assert = require('assert');

describe('Flow module', function () {
    describe('Serial', function () {
        it('should call functions sequentially', function () {
            var func1 = function (next) {
                next(null, 'data');
            };
            var func2 = function (data, next) {
                next(null, 'result');
            };
            var spy1 = sinon.spy(func1);
            var spy2 = sinon.spy(func2);
            var spy3 = sinon.spy(function (error, data) {});
            flow.serial([spy1, spy2], spy3);
            assert.ok(spy1.calledOnce);
            assert.ok(spy2.calledOnce);
            assert.ok(spy1.calledBefore(spy2));
            assert.ok(spy3.calledAfter(spy2));
        });

        it('should work correctly with empty array', function () {
            var spy = sinon.spy(function (error, data) {});
            flow.serial([], spy);
            assert.ok(spy.calledOnce);
            assert.ok(spy.calledWith(null, []));
        });

        it('should not call second function if first failed', function () {
            var func1 = function (next) {
                next('error1', []);
            };
            var func2 = function (data, next) {
                next(null, 'result');
            };
            var spy1 = sinon.spy(func1);
            var spy2 = sinon.spy(func2);
            var spy3 = sinon.spy(function (error, data) {});
            flow.serial([spy1, spy2], spy3);
            assert.ok(spy1.calledOnce);
            assert.ok(spy2.callCount === 0);
            assert.ok(spy3.calledWith('error1', []));
        });

        it('should call callback with error if one of functions failed', function () {
            var func1 = function (next) {
                next(null, 'data');
            };
            var func2 = function (data, next) {
                next('error2', []);
            };
            var spy1 = sinon.spy(func1);
            var spy2 = sinon.spy(func2);
            var spy3 = sinon.spy(function (error, data) {});
            flow.serial([spy1, spy2], spy3);
            assert.ok(spy1.calledOnce);
            assert.ok(spy2.calledOnce);
            assert.ok(spy3.calledWith('error2', []));
        });

        it('should call next function with data from previous function', function () {
            var func1 = function (next) {
                next(null, 'data');
            };
            var func2 = function (data, next) {
                next(null, 'result');
            };
            var spy1 = sinon.spy(func1);
            var spy2 = sinon.spy(func2);
            var spy3 = sinon.spy(function (error, data) {});
            flow.serial([spy1, spy2], spy3);
            assert.ok(spy2.calledWith('data'));
            assert.ok(spy3.calledWith(null, 'result'));
        });
    });

    describe('Parallel', function () {
        it('should call all functions if there is no error', function () {
            var spy1 = sinon.spy(function (next) {
                next(null);
            });
            var spy2 = sinon.spy(function (next) {
                next(null);
            });
            var spy3 = sinon.spy(function (next) {
                next(null);
            });
            var cb = sinon.spy(function (error, data) {});
            flow.parallel([spy1, spy2, spy3], cb);
            assert.ok(spy1.calledOnce);
            assert.ok(spy2.calledOnce);
            assert.ok(spy3.calledOnce);
            assert.ok(cb.calledOnce);
        });

        it('should call callback after all functions', function () {
            var spy1 = sinon.spy(function (next) {
                next(null);
            });
            var spy2 = sinon.spy(function (next) {
                next(null);
            });
            var spy3 = sinon.spy(function (next) {
                next(null);
            });
            var spy = sinon.spy(function (error, data) {});
            flow.parallel([spy1, spy2, spy3], spy);
            assert.ok(spy.calledAfter(spy1));
            assert.ok(spy.calledAfter(spy2));
            assert.ok(spy.calledAfter(spy3));
            assert.ok(spy.calledOnce);
        });

        it('should call callback with error if one of functions failed', function () {
            var spy1 = sinon.spy(function (next) {
                next(null);
            });
            var spy2 = sinon.spy(function (next) {
                next('error');
            });
            var spy = sinon.spy(function (error, data) {});
            flow.parallel([spy1, spy2], spy);
            assert.ok(spy.calledWith('error'));
        });

        it('should call second function if first failed', function () {
            var spy1 = sinon.spy(function (next) {
                next('error');
            });
            var spy2 = sinon.spy(function (next) {
                next(null);
            });
            var spy = sinon.spy(function (error, data) {});
            flow.parallel([spy1, spy2], spy);
            assert.ok(spy.calledWith('error'));
            assert.ok(spy1.calledOnce);
            assert.ok(spy2.calledOnce);
        });

        it('should call callback with [] if first arg is []', function () {
            var spy = sinon.spy(function (error, data) {});
            flow.parallel([], spy);
            assert.ok(spy.calledOnce);
            assert.ok(spy.calledWith(null, []));
        });
    });

    describe('Map', function () {
        it('should call func with all values', function () {
            var spy = sinon.spy(function (value, next) {
                next(null, value);
            });
            var values = [0, 1, 2];
            flow.map(values, spy, function (error, data) {});
            assert.ok(spy.calledWith(0));
            assert.ok(spy.calledWith(1));
            assert.ok(spy.calledWith(2));
            assert.ok(spy.callCount === 3);
        });

        it('should return error that was thrown first', function () {
            var spy = sinon.spy(function (value, next) {
                next(value, value);
            });
            var values = ['first', 'second'];
            var cb = sinon.spy(function (error, data) {});
            flow.map(values, spy, cb);
            assert.ok(cb.calledWith('first'));
            assert.ok(cb.calledOnce);
        });

        it('should call callback with [] if first arg is []', function () {
            var spy = sinon.spy(function (error, data) {});
            var func = sinon.spy();
            flow.map([], func, spy);
            assert.ok(spy.calledOnce);
            assert.ok(spy.calledWith(null, []));
        });

        it('should call callback without error if all calls without errors', function () {
            var spy = sinon.spy(function (value, next) {
                next(null, value);
            });
            var values = [0, 1, 2];
            var cb = sinon.spy(function (error, data) {});
            flow.map(values, spy, cb);
            assert.ok(cb.calledOnce);
            assert.ok(cb.calledWith(null));
        });
    });
});
