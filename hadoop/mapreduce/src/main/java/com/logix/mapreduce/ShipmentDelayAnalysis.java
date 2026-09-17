package com.logix.mapreduce;

import java.io.IOException;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.DoubleWritable;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;

import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;

import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

public class ShipmentDelayAnalysis {

    // ---------------------------------------------------------
    // MAPPER
    // ---------------------------------------------------------
    public static class ShipmentMapper
            extends Mapper<LongWritable, Text, Text, Text> {

        private final Text routeId = new Text();
        private final Text outputValue = new Text();

        @Override
        protected void map(
                LongWritable key,
                Text value,
                Context context)
                throws IOException, InterruptedException {

            String line = value.toString().trim();

            // Skip CSV header
            if (line.startsWith("shipment_id")) {
                return;
            }

            String[] fields = line.split(",", -1);

            // Expected schema:
            // 0 shipment_id
            // 1 vehicle_id
            // 2 route_id
            // 3 origin
            // 4 destination
            // 5 distance_km
            // 6 weight_kg
            // 7 priority
            // 8 dispatch_time
            // 9 expected_delivery
            // 10 actual_delivery
            // 11 status
            // 12 delay_minutes

            if (fields.length < 13) {
                return;
            }

            String route = fields[2].trim();
            String status = fields[11].trim();

            try {
                double delay = Double.parseDouble(fields[12].trim());

                int delayed = delay > 0 ? 1 : 0;

                /*
                 * Value format:
                 * delay,delayed_count
                 */
                outputValue.set(delay + "," + delayed);

                routeId.set(route);

                context.write(routeId, outputValue);

            } catch (NumberFormatException e) {
                // Ignore malformed delay values
            }
        }
    }

    // ---------------------------------------------------------
    // REDUCER
    // ---------------------------------------------------------
    public static class ShipmentReducer
            extends Reducer<Text, Text, Text, Text> {

        @Override
        protected void reduce(
                Text key,
                Iterable<Text> values,
                Context context)
                throws IOException, InterruptedException {

            int totalShipments = 0;
            int delayedShipments = 0;

            double totalDelay = 0;
            double maxDelay = 0;

            for (Text value : values) {

                String[] parts = value.toString().split(",");

                if (parts.length != 2) {
                    continue;
                }

                double delay = Double.parseDouble(parts[0]);
                int delayed = Integer.parseInt(parts[1]);

                totalShipments++;

                totalDelay += delay;

                if (delay > maxDelay) {
                    maxDelay = delay;
                }

                delayedShipments += delayed;
            }

            double averageDelay =
                    totalShipments > 0
                            ? totalDelay / totalShipments
                            : 0;

            double onTimePercentage =
                    totalShipments > 0
                            ? ((totalShipments - delayedShipments)
                            * 100.0 / totalShipments)
                            : 0;

            String result =
                    "shipments=" + totalShipments
                    + ", delayed=" + delayedShipments
                    + ", avg_delay=" + String.format("%.2f", averageDelay)
                    + ", max_delay=" + String.format("%.2f", maxDelay)
                    + ", on_time_pct=" + String.format("%.2f", onTimePercentage);

            context.write(key, new Text(result));
        }
    }

    // ---------------------------------------------------------
    // DRIVER
    // ---------------------------------------------------------
    public static void main(String[] args)
            throws Exception {

        if (args.length != 2) {
            System.err.println(
                    "Usage: ShipmentDelayAnalysis <input> <output>");
            System.exit(2);
        }

        Configuration conf = new Configuration();

        Job job = Job.getInstance(
                conf,
                "LOGIX Shipment Delay Analysis");

        job.setJarByClass(ShipmentDelayAnalysis.class);

        job.setMapperClass(ShipmentMapper.class);
        job.setReducerClass(ShipmentReducer.class);

        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(Text.class);

        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(Text.class);

        FileInputFormat.addInputPath(
                job,
                new Path(args[0]));

        FileOutputFormat.setOutputPath(
                job,
                new Path(args[1]));

        System.exit(
                job.waitForCompletion(true)
                        ? 0
                        : 1);
    }
}
