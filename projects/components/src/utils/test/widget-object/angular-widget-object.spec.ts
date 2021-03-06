/*!
 * Copyright 2019 VMware, Inc.
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { Component, Input, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AngularWidgetObjectFinder } from './angular-widget-finder';
import { AngularLocatorDriver, TestElement } from './angular-widget-object';
import { BaseWidgetObject } from './widget-object';

/**
 * This is the reusable component being tested, typically goes in its own file
 */
@Component({
    selector: 'vcd-click-tracker',
    template: `
        <div>
            <h1>
                <b>hello</b>
            </h1>
            <p (click)="clickCount = clickCount + 1">
                Clicks: <span class="click-count">{{ clickCount }}</span>
            </p>
        </div>
    `,
})
class ClickTrackerComponent {
    @Input() header = 'Click Tracker';
    clickCount = 0;
}

class HeaderWidgetObject<T> extends BaseWidgetObject<T> {
    static tagName = 'h1';

    getBoldText(): T {
        return this.locatorDriver.get('b').unwrap();
    }
}

/**
 * Each component being tested should have a matching widget object.
 *
 * This class could be tested mostly through the component instance but we are using the HTML to show the base class's
 * functionality
 */
class ClickTrackerWidgetObject<T> extends BaseWidgetObject<T> {
    static tagName = 'vcd-click-tracker';

    getClickCount = this.locatorForChild('.click-count');

    getHeaderText = this.locatorForChild('h1');

    getTrackerElement = this.locatorForChild('p');

    findHeaderWidget(): HeaderWidgetObject<T> {
        return this.locatorDriver.findWidget(HeaderWidgetObject);
    }
}

/**
 * This is the host component that is typically created within the test
 */
@Component({
    template: `<vcd-click-tracker header="First"></vcd-click-tracker> `,
})
class HostComponent {}

interface HasAngularFinder {
    finder: AngularWidgetObjectFinder;
}

/**
 * Test object for the tests below
 */
interface HasClickTracker {
    clickTracker: ClickTrackerWidgetObject<TestElement>;
    fixture: ComponentFixture<ClickTrackerComponent>;
}

function setup(fixtureRoot: Type<unknown>): void {
    beforeEach(async function (this: HasAngularFinder): Promise<void> {
        await TestBed.configureTestingModule({
            declarations: [ClickTrackerComponent, fixtureRoot],
        }).compileComponents();
        this.finder = new AngularWidgetObjectFinder(fixtureRoot);
        this.finder.detectChanges();
    });
}

describe('AngularWidgetFinder', () => {
    describe('when there is a single instance within host', () => {
        setup(HostComponent);

        describe('find', () => {
            it('returns the first one within the fixture if no classname is specified', function (this: HasAngularFinder): void {
                const widget = this.finder.find(ClickTrackerWidgetObject);
                expect(widget.getHeaderText().text()).toEqual('hello');
            });

            it('can find widgets within widgets', function (this: HasAngularFinder): void {
                expect(this.finder.find(ClickTrackerWidgetObject).findHeaderWidget().getBoldText().text()).toEqual(
                    'hello'
                );
            });
        });
    });
});

/**
 * For all these tests of base class functionality, you must look at the implementation of the methods being called
 * in the concrete {@link ClickTrackerWidgetObject}
 */
describe('WidgetObject (through ClickTracerWidgetObject)', () => {
    beforeEach(async function (this: HasClickTracker): Promise<void> {
        await TestBed.configureTestingModule({
            declarations: [ClickTrackerComponent],
        }).compileComponents();

        this.fixture = TestBed.createComponent(ClickTrackerComponent);
        this.fixture.detectChanges();
        this.clickTracker = new ClickTrackerWidgetObject(
            new AngularLocatorDriver(
                new TestElement([this.fixture.debugElement], this.fixture),
                this.fixture.debugElement
            )
        );
    });

    describe('getText', () => {
        it('can find elements within itself passing a css query', async function (this: HasClickTracker): Promise<
            void
        > {
            expect(this.clickTracker.getClickCount().text()).toEqual('0');
        });
    });

    describe('click', () => {
        it('calls detectChanges after clicking', async function (this: HasClickTracker): Promise<void> {
            this.clickTracker.getTrackerElement().click();
            expect(this.clickTracker.getClickCount().text()).toEqual('1');
        });
    });
});
