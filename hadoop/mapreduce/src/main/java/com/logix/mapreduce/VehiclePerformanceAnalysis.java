package com.logix.mapreduce;

import java.io.IOException;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

public class VehiclePerformanceAnalysis {

    // =========================================================
    // MAPPER
    // =========================================================
    public static class VehicleMapper
            extends Mapper<LongWritable, Text, Text, Text> {

        private final Text vehicleId = new Text();
        private final Text outputValue = new Text();

        @Override
        protected void map(
                LongWritable key,
                Text value,
                Context context)
                throws IOException, InterruptedException {

            String line = value.toString().trim();

            // Skip CSV header
            if (line.startsWith("vehicle_id")) {
                return;
            }

            String[] fields = line.split(",", -1);

            /*
             * Actual vehicles.csv schema:
             *
             * 0 vehicle_id
             * 1 vehicle_type
             * 2 capacity_kg
             * 3 fuel_type
             * 4 mileage
             * 5 maintenance_status
             * 6 vehicle_age
             */

            if (fields.length < 7) {
                return;
            }

            String id = fields[0].trim();
            String vehicleType = fields[1].trim();
            String fuelType = fields[3].trim();
            String maintenanceStatus = fields[5].trim();

            try {

                double capacity =
                        Double.parseDouble(fields[2].trim());

                double mileage =
                        Double.parseDouble(fields[4].trim());

                double age =
                        Double.parseDouble(fields[6].trim());

                /*
                 * Mapper sends:
                 *
                 * vehicleType,
                 * fuelType,
                 * capacity,
                 * mileage,
                 * maintenanceStatus,
                 * age
                 */

                String result =
                        vehicleType + ","
                        + fuelType + ","
                        + capacity + ","
                        + mileage + ","
                        + maintenanceStatus + ","
                        + age;

                vehicleId.set(id);
                outputValue.set(result);

                context.write(
                        vehicleId,
                        outputValue
                );

            } catch (NumberFormatException e) {

                // Ignore malformed records
            }
        }
    }

    // =========================================================
    // REDUCER
    // =========================================================
    public static class VehicleReducer
            extends Reducer<Text, Text, Text, Text> {

        @Override
        protected void reduce(
                Text key,
                Iterable<Text> values,
                Context context)
                throws IOException, InterruptedException {

            for (Text value : values) {

                String[] fields =
                        value.toString().split(",", -1);

                if (fields.length < 6) {
                    continue;
                }

                String vehicleType = fields[0];
                String fuelType = fields[1];

                double capacity =
                        Double.parseDouble(fields[2]);

                double mileage =
                        Double.parseDouble(fields[3]);

                String maintenanceStatus =
                        fields[4];

                double age =
                        Double.parseDouble(fields[5]);

                // -------------------------------------------------
                // VEHICLE PERFORMANCE SCORE
                // -------------------------------------------------

                // Mileage contributes up to 40 points
                double mileageScore =
                        Math.min(
                                40.0,
                                mileage * 4.0
                        );

                // Maintenance contributes up to 25 points
                double maintenanceScore;

                if (maintenanceStatus.equalsIgnoreCase("Excellent")) {

                    maintenanceScore = 25;

                } else if (maintenanceStatus.equalsIgnoreCase("Good")) {

                    maintenanceScore = 20;

                } else if (maintenanceStatus.equalsIgnoreCase("Warning")) {

                    maintenanceScore = 10;

                } else {

                    maintenanceScore = 5;
                }

                // Newer vehicles receive a higher score
                double ageScore =
                        Math.max(
                                0,
                                20 - (age * 2)
                        );

                // Fuel type contribution
                double fuelScore;

                if (fuelType.equalsIgnoreCase("Electric")) {

                    fuelScore = 15;

                } else if (fuelType.equalsIgnoreCase("CNG")) {

                    fuelScore = 12;

                } else if (fuelType.equalsIgnoreCase("Diesel")) {

                    fuelScore = 8;

                } else {

                    fuelScore = 5;
                }

                double performanceScore =
                        mileageScore
                        + maintenanceScore
                        + ageScore
                        + fuelScore;

                performanceScore =
                        Math.max(
                                0,
                                Math.min(
                                        100,
                                        performanceScore
                                )
                        );

                String performanceLevel;

                if (performanceScore >= 80) {

                    performanceLevel = "Excellent";

                } else if (performanceScore >= 60) {

                    performanceLevel = "Good";

                } else if (performanceScore >= 40) {

                    performanceLevel = "Moderate";

                } else {

                    performanceLevel = "Poor";
                }

                String result =
                        "type=" + vehicleType
                        + ", fuel=" + fuelType
                        + ", capacity_kg="
                        + String.format("%.0f", capacity)
                        + ", mileage="
                        + String.format("%.2f", mileage)
                        + ", maintenance="
                        + maintenanceStatus
                        + ", age="
                        + String.format("%.0f", age)
                        + ", performance_score="
                        + String.format("%.2f", performanceScore)
                        + ", performance_level="
                        + performanceLevel;

                context.write(
                        key,
                        new Text(result)
                );
            }
        }
    }

    // =========================================================
    // DRIVER
    // =========================================================
    public static void main(String[] args)
            throws Exception {

        if (args.length != 2) {

            System.err.println(
                    "Usage: VehiclePerformanceAnalysis <input> <output>"
            );

            System.exit(2);
        }

        Configuration conf =
                new Configuration();

        Job job =
                Job.getInstance(
                        conf,
                        "LOGIX Vehicle Performance Analysis"
                );

        job.setJarByClass(
                VehiclePerformanceAnalysis.class
        );

        job.setMapperClass(
                VehicleMapper.class
        );

        job.setReducerClass(
                VehicleReducer.class
        );

        job.setMapOutputKeyClass(
                Text.class
        );

        job.setMapOutputValueClass(
                Text.class
        );

        job.setOutputKeyClass(
                Text.class
        );

        job.setOutputValueClass(
                Text.class
        );

        FileInputFormat.addInputPath(
                job,
                new Path(args[0])
        );

        FileOutputFormat.setOutputPath(
                job,
                new Path(args[1])
        );

        System.exit(
                job.waitForCompletion(true)
                        ? 0
                        : 1
        );
    }
}
