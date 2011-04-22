if (typeof require != "undefined") {
    var testCase = require("buster-util").testCase;
    var sinon = require("sinon");
    var buster = require("buster-core");

    buster.extend(buster, {
        assert: require("buster-assert"),
        eventEmitter: require("buster-event-emitter"),
        bddConsoleReporter: require("../../../../lib/buster-test/reporters/bdd-console")
    });
}

function runnerSetUp() {
    this.io = {
        content: "",
        puts: function (str) { this.print(str + "\n"); },
        print: function (str) { this.content += str; },
        toString: function () { return this.content }
    };

    this.runner = buster.create(buster.eventEmitter);
}

function reporterSetUp() {
    runnerSetUp.call(this);
    this.reporter = buster.bddConsoleReporter.create({ io: this.io }).listen(this.runner);
}

function generateError(message, type) {
    var error = new Error(message);
    error.name = type || "AssertionError";
    try { throw error; } catch (e) { return e; }
}

testCase("BDDConsoleReporterTestsRunningTest", {
    setUp: reporterSetUp,

    "should print context name when entering top-level context": function () {
        this.reporter.contextStart({ name: "Some context" });

        buster.assert.equals(this.io.toString(), "Some context\n");
    },

    "should print passing test name indented with tick": function () {
        this.reporter.testSuccess({ name: "should do something" });

        buster.assert.match(this.io.toString(), "  ✓ should do something\n");
    },

    "should print passing test name with full contextual name": function () {
        this.reporter.contextStart({ name: "Some stuff" });
        this.reporter.contextStart({ name: "in some state" });
        this.reporter.testSuccess({ name: "should do it" });

        buster.assert.match(this.io.toString(), "  ✓ in some state should do it\n");
    },

    "should not 'remember' completed contexts": function () {
        this.reporter.contextStart({ name: "Some stuff" });
        this.reporter.contextStart({ name: "in some state" });
        this.reporter.contextEnd({ name: "in some state" });
        this.reporter.contextStart({ name: "in some other state" });
        this.reporter.testSuccess({ name: "should do it" });

        buster.assert.match(this.io.toString(), "  ✓ in some other state should do it\n");
    },

    "should print failed test name indented with cross": function () {
        this.reporter.testFailure({ name: "should do something" });

        buster.assert.match(this.io.toString(), "  ✖ should do something\n");
    },

    "should print test failure with stack trace": function () {
        this.reporter.testFailure({
            name: "should do something",
            error: generateError("Expected a to be equal to b")
        });

        buster.assert.match(this.io.toString(), "    Expected a to be equal to b\n");
        buster.assert.match(this.io.toString(), "      at Object");
    },

    "should print failed test name with full contextual name": function () {
        this.reporter.contextStart({ name: "Some stuff" });
        this.reporter.contextStart({ name: "in some state" });
        this.reporter.testFailure({ name: "should do it" });

        buster.assert.match(this.io.toString(), "  ✖ in some state should do it\n");
    },

    "should print errored test name indented with cross": function () {
        this.reporter.testError({ name: "should do something" });

        buster.assert.match(this.io.toString(), "  ✖ should do something\n");
    },

    "should print test error with stack trace": function () {
        this.reporter.testFailure({
            name: "should do something",
            error: generateError("Oh shizzle!", "SomeError")
        });

        buster.assert.match(this.io.toString(), "    SomeError: Oh shizzle!\n");
        buster.assert.match(this.io.toString(), "      at Object");
    },

    "should print failed test name with full contextual name": function () {
        this.reporter.contextStart({ name: "Some stuff" });
        this.reporter.contextStart({ name: "in some state" });
        this.reporter.testError({ name: "should do it" });

        buster.assert.match(this.io.toString(), "  ✖ in some state should do it\n");
    },

    "should print deferred test with indented dash": function () {
        this.reporter.testDeferred({ name: "should do something" });

        buster.assert.match(this.io.toString(), "  - should do something\n");
    },

    "should print deferred test name with full contextual name": function () {
        this.reporter.contextStart({ name: "Some stuff" });
        this.reporter.contextStart({ name: "in some state" });
        this.reporter.testDeferred({ name: "should do it" });

        buster.assert.match(this.io.toString(), "  - in some state should do it\n");
    },

    "should print timed out test with indented ellipsis": function () {
        this.reporter.testTimeout({ name: "should do something" });

        buster.assert.match(this.io.toString(), "  … should do something\n");
    },

    "should print timed out test name with full contextual name": function () {
        this.reporter.contextStart({ name: "Some stuff" });
        this.reporter.contextStart({ name: "in some state" });
        this.reporter.testTimeout({ name: "should do it" });

        buster.assert.match(this.io.toString(), "  … in some state should do it\n");
    },

    "should print log message for passing test": function () {
        this.reporter.contextStart({ name: "Some stuff" });
        this.reporter.contextStart({ name: "in some state" });
        this.reporter.log({ level: "log", message: "Is message" });
        this.reporter.testSuccess({ name: "should do it" });

        buster.assert.match(this.io.toString(), "do it\n    [LOG] Is message\n");
    },

    "should print log message for failing test": function () {
        this.reporter.contextStart({ name: "Some stuff" });
        this.reporter.contextStart({ name: "in some state" });
        this.reporter.log({ level: "log", message: "Is message" });
        this.reporter.testFailure({ name: "should do it" });

        buster.assert.match(this.io.toString(), "do it\n    [LOG] Is message\n");
    },

    "should print log message for errored test": function () {
        this.reporter.contextStart({ name: "Some stuff" });
        this.reporter.contextStart({ name: "in some state" });
        this.reporter.log({ level: "log", message: "Is message" });
        this.reporter.testError({ name: "should do it" });

        buster.assert.match(this.io.toString(), "do it\n    [LOG] Is message\n");
    },

    "should print log message for timed out test": function () {
        this.reporter.contextStart({ name: "Some stuff" });
        this.reporter.contextStart({ name: "in some state" });
        this.reporter.log({ level: "log", message: "Is message" });
        this.reporter.testTimeout({ name: "should do it" });

        buster.assert.match(this.io.toString(), "do it\n    [LOG] Is message\n");
    },

    "should not re-print previous log messages": function () {
        this.reporter.contextStart({ name: "Some stuff" });
        this.reporter.contextStart({ name: "in some state" });
        this.reporter.log({ level: "log", message: "Is message" });
        this.reporter.testTimeout({ name: "should do it" });
        this.reporter.log({ level: "warn", message: "Is other message" });
        this.reporter.testTimeout({ name: "should go again" });

        buster.assert.match(this.io.toString(), "go again\n    [WARN] Is other");
    }
});

testCase("BDDConsoleReporterEventMappingTest", sinon.testCase({
    setUp: function () {
        this.stub(buster.bddConsoleReporter, "contextStart");
        this.stub(buster.bddConsoleReporter, "contextEnd");
        this.stub(buster.bddConsoleReporter, "testSuccess");
        this.stub(buster.bddConsoleReporter, "testFailure");
        this.stub(buster.bddConsoleReporter, "testError");
        this.stub(buster.bddConsoleReporter, "testTimeout");
        this.stub(buster.bddConsoleReporter, "testDeferred");
        this.stub(buster.bddConsoleReporter, "log");
        this.stub(buster.bddConsoleReporter, "printStats");

        this.runner = buster.create(buster.eventEmitter);
        this.runner.console = buster.create(buster.eventEmitter);
        this.reporter = buster.bddConsoleReporter.create().listen(this.runner);
    },

    "should map suite:end to printStats": function () {
        this.runner.emit("suite:end", {});

        buster.assert(this.reporter.printStats.calledOnce);
    },

    "should map context:start to contextStart": function () {
        this.runner.emit("context:start");

        buster.assert(this.reporter.contextStart.calledOnce);
    },

    "should map context:end to contextEnd": function () {
        this.runner.emit("context:end");

        buster.assert(this.reporter.contextEnd.calledOnce);
    },

    "should map test:success to testSuccess": function () {
        this.runner.emit("test:success");

        buster.assert(this.reporter.testSuccess.calledOnce);
    },

    "should map test:error to testError": function () {
        this.runner.emit("test:error");

        buster.assert(this.reporter.testError.calledOnce);
    },

    "should map test:fail to testFailure": function () {
        this.runner.emit("test:failure");

        buster.assert(this.reporter.testFailure.calledOnce);
    },

    "should map test:timeout to testTimeout": function () {
        this.runner.emit("test:timeout");

        buster.assert(this.reporter.testTimeout.calledOnce);
    },

    "should map logger log to log": function () {
        this.runner.console.emit("log");

        buster.assert(this.reporter.log.calledOnce);
    },

    "should map test:deferred to testDeferred": function () {
        this.runner.emit("test:deferred");

        buster.assert(this.reporter.testDeferred.calledOnce);
    }
}, "should"));

testCase("BDDConsoleReporterColoredTestsRunningTest", {
    setUp: function () {
        runnerSetUp.call(this);

        this.reporter = buster.bddConsoleReporter.create({
            io: this.io,
            color: true
        }).listen(this.runner);
    },

    "should print passing test name in green": function () {
        this.reporter.testSuccess({ name: "should do it" });

        buster.assert.match(this.io.toString(), "\033[32m  ✓ should do it\033[0m\n");
    },

    "should print failed test name in red": function () {
        this.reporter.testFailure({ name: "should do it" });

        buster.assert.match(this.io.toString(), "\033[31m  ✖ should do it\033[0m\n");
    },

    "should print test failure stack trace in red": function () {
        this.reporter.testFailure({
            name: "should do something",
            error: generateError("Expected a to be equal to b")
        });

        buster.assert.match(this.io.toString(), "    \033[31mExpected a to be equal to b\033[0m\n");
    },

    "should print errored test name indented with cross": function () {
        this.reporter.testError({ name: "should do it", error: { name: "Error" } });

        buster.assert.match(this.io.toString(), "\033[33m  ✖ Should do it\033[0m\n");
    },

    "should print test error stack trace in yellow": function () {
        this.reporter.testFailure({
            name: "should do something",
            error: generateError("Oh shizzle!", "SomeError")
        });

        buster.assert.match(this.io.toString(), "    \033[33mSomeError: Oh shizzle!\033[0m\n");
        buster.assert.match(this.io.toString(), "      at Object");
    },

    "should print deferred test in cyan": function () {
        this.reporter.testDeferred({ name: "should do it" });

        buster.assert.match(this.io.toString(), "\033[36m  - should do it\033[0m\n");
    },

    "should print timed out test in red": function () {
        this.reporter.testTimeout({ name: "should do something" });

        buster.assert.match(this.io.toString(), "\033[31m  … should do something\033[0m\n");
    }
});