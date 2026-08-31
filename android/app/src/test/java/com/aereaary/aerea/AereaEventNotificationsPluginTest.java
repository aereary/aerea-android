package com.aereaary.aerea;

import static org.junit.Assert.*;
import java.time.LocalDate;
import org.junit.Test;
import org.json.JSONObject;

public class AereaEventNotificationsPluginTest {
    @Test public void mapsEveryReminderLead() {
        assertEquals(0, AereaEventNotificationsPlugin.leadMinutes("At start time"));
        assertEquals(10, AereaEventNotificationsPlugin.leadMinutes("10 minutes before"));
        assertEquals(30, AereaEventNotificationsPlugin.leadMinutes("30 minutes before"));
        assertEquals(60, AereaEventNotificationsPlugin.leadMinutes("1 hour before"));
        assertEquals(1440, AereaEventNotificationsPlugin.leadMinutes("1 day before"));
        assertEquals(-1, AereaEventNotificationsPlugin.leadMinutes("None"));
    }

    @Test public void expandsCommonRepeatsWithoutDuplicateDays() throws Exception {
        LocalDate start = LocalDate.of(2026, 8, 29);
        JSONObject event = new JSONObject();
        assertTrue(AereaEventNotificationsPlugin.occurs(event, start, start.plusDays(7), "Weekly"));
        assertFalse(AereaEventNotificationsPlugin.occurs(event, start, start.plusDays(6), "Weekly"));
        assertTrue(AereaEventNotificationsPlugin.occurs(event, start, LocalDate.of(2026, 9, 29), "Monthly"));
        assertFalse(AereaEventNotificationsPlugin.occurs(event, start, start.plusDays(1), "Never"));
        event.put("customRepeatEvery", 2); event.put("customRepeatUnit", "weeks");
        assertTrue(AereaEventNotificationsPlugin.occurs(event, start, start.plusDays(14), "Custom"));
        assertFalse(AereaEventNotificationsPlugin.occurs(event, start, start.plusDays(7), "Custom"));
    }
}
